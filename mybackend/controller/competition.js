const axios = require("axios");
const Competition = require("../models/Competition");
const User = require("../models/User");

class CompetitionController {

    allCompetitions = async (req, res) => {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        try {
            const competitions = await Competition.find({}, 'name description status reward points image languages types startDate endDate').skip(skip).limit(limit);

            if (competitions.length === 0) {
                return res.json({
                    message: "No competitions",
                    result: []
                });
            };

            const totalDocuments = await Competition.countDocuments();

            res.json({
                message: "OK",
                metaData: {
                    totalRecords: totalDocuments,
                    totalPages: Math.ceil(totalDocuments / limit),
                    currentPage: page,
                    limit
                },
                result: competitions
            })

        } catch (error) {
            console.error('Error fetching competitions:', error.message);
            res.status(500).json({ message: error.message });
        }
    }

    selectedCompetition = async (req, res) => {
        const competitionId = req.params.id;
        try {

            const competition = await Competition.findById(competitionId).populate('judges.leadJudge')
                .populate('judges.judges');

            if (!competition) {
                res.status(404).json({
                    message: "Competition not found"
                });
            };

            return res.json({
                message: "OK",
                competition
            })

        } catch (error) {
            console.error('Error fetching competition details:', error.message);
            res.status(500).json({ message: error.message });
        }
    }

    // adding a judge to a competition
    addJudge = async (req, res) => {
        const { id } = req.params;
        const { username, type } = req.body;

        try {
            const competition = await Competition.findById(id);
            if (!competition) {
                return res.status(404).json({ message: 'Competition not found' });
            }

            const user = await User.findOne({ username });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (type === 'judge') {
                const isJudge = competition.judges.judges.some(judge => judge.equals(user._id));
                const isLeadJudge = competition.judges.leadJudge && competition.judges.leadJudge.equals(user._id);

                if (isJudge || isLeadJudge) {
                    return res.status(400).json({ message: 'User is already a judge or lead judge' });
                }

                competition.judges.judges.push(user._id);
            }

            const allJudges = await User.find({ _id: { $in: competition.judges.judges } }).sort({ xp: -1 });

            if (allJudges.length > 0) {
                competition.judges.leadJudge = allJudges[0]._id;
            }

            await competition.save();

            res.status(200).json(competition);
        } catch (error) {
            console.error('Error assigning judge role:', error.message);
            res.status(500).json({ message: error.message });
        }
    }

    // Endpoint to assign judge role to the current user
    makeJudge = async (req, res) => {

        const competitionId = req.params.id;
        const { username } = req.body;

        try {

            const competition = await Competition.findById(competitionId);
            if (!competition) {
                return res.status(404).json({
                    message: "Competition not found"
                })
            };

            const user = await User.findOne({ username });
            if (!user) {
                return res.status(404).json({
                    message: "User not found"
                })
            };

            const isJudge = competition.judges.judges.some(judge => judge.equals(user._id));
            const isLeadJudge = competition.judges.leadJudge && competition.judges.leadJudge.equals(user._id);

            if (isJudge || isLeadJudge) {
                return res.status(400).json({ message: 'User is already a reviewer or lead reviewer' });
            };

            competition.judges.judges.push(user._id);
            await competition.save();

            const teamSlug = `judge-repo1`;
            const org = process.env.GITHUB_ORG;
            const githubToken = process.env.GITHUB_ADMIN_TOKEN;

            await axios.put(
                `https://api.github.com/orgs/${org}/teams/${teamSlug}/memberships/${username}`,
                {},
                {
                    headers: {
                        Authorization: `token ${githubToken}`,
                        Accept: 'application/vnd.github.v3+json'
                    }
                }
            );

            res.status(200).json(competition);

        } catch (error) {
            console.error('Error assigning judge role:', error.message);
            res.status(500).json({ message: error.message });
        }
    }

    approveAndMergePR = async (req, res) => {
        const { id } = req.params;
        const { prNumber } = req.body;

        try {
            const competition = await Competition.findById(id);
            if (!competition) {
                return res.status(404).json({ message: 'Project not found' });
            }

            const repoUrl = new URL(competition.repositoryLink).pathname.substring(1);
            const prResponse = await axios.get(`https://api.github.com/repos/${repoUrl}/pulls/${prNumber}`, {
                headers: {
                    Authorization: `token ${process.env.GITHUB_ADMIN_TOKEN}`,
                },
            });

            const { labels, user: { login } } = prResponse.data;
            const user = await User.findOne({ username: login });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            let reward = 0;
            let updateData = {};

            if (labels.some(label => label.name.toLowerCase() === 'feature')) {
                reward = competition.rewards.feature;
                updateData = { $inc: { totalEarnings: reward, Features: 1 } };
            } else if (labels.some(label => label.name.toLowerCase() === 'bug')) {
                reward = competition.rewards.bug;
                updateData = { $inc: { totalEarnings: reward, Bugs: 1 } };
            } else if (labels.some(label => label.name.toLowerCase() === 'optimization')) {
                reward = competition.rewards.optimization;
                updateData = { $inc: { totalEarnings: reward, Optimisations: 1 } };
            } else if (labels.some(label => label.name.toLowerCase() === 'security')) {
                reward = competition.rewards.security;
                updateData = { $inc: { totalEarnings: reward } };
            }

            await axios.put(
                `https://api.github.com/repos/${repoUrl}/pulls/${prNumber}/merge`,
                {},
                {
                    headers: {
                        Authorization: `token ${process.env.GITHUB_ADMIN_TOKEN}`,
                    },
                }
            );

            await User.findByIdAndUpdate(user._id, updateData);

            res.status(200).json({ message: 'PR merged and user earnings updated' });
        } catch (error) {
            console.error('Error merging PR:', error.message);
            res.status(500).json({ message: error.message });
        }
    }

    updateCompetitionStatus = async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;

        try {
            const competition = await Competition.findById(id);
            if (!competition) {
                return res.status(404).json({ message: 'Competition not found' });
            }

            competition.status = status;
            await competition.save();

            res.status(200).json(competition);
        } catch (error) {
            console.error('Error changing competition status:', error.message);
            res.status(500).json({ message: error.message });
        }
    }

    approveSubmission = async (req, res) => {
        const { id } = req.params;
        const { username, submissionType } = req.body;

        try {
            const competition = await Competition.findById(id);
            const user = await User.findOne({ username });

            if (!competition || !user) {
                return res.status(404).json({ message: 'Competition or user not found' });
            }

            // Determine the payout based on the submission type
            let payout = 0;
            if (submissionType === 'Feature') {
                payout = (competition.reward * competition.rewardDistribution.feature) / 100;
            } else if (submissionType === 'Optimization') {
                payout = (competition.reward * competition.rewardDistribution.optimization) / 100;
            } else if (submissionType === 'Bug') {
                payout = (competition.reward * competition.rewardDistribution.bugs) / 100;
            }

            // Update the user's total earnings and add the approved submission
            user.totalEarnings += payout;
            user.approvedSubmissions.push({
                competitionId: competition._id,
                submissionType,
                payout
            });

            await user.save();

            res.status(200).json({ message: 'Submission approved', payout });
        } catch (error) {
            console.error('Error approving submission:', error);
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = CompetitionController;