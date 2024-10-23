const express = require('express');
const checkRole = require('../middleware/checkRole');
const CompetitionController  = require('../controller/competition');
const verifyAuth = require('../middleware/verifyAuth');

const router = express.Router();

const competitionController = new CompetitionController();

router.get('/competitions', competitionController.allCompetitions);
router.get('/competitions/:id', competitionController.selectedCompetition);
router.post("/competitions/:id/addJudge", verifyAuth, competitionController.addJudge);
router.patch('/competitions/:id/becomeJudge', verifyAuth, competitionController.makeJudge);
router.post('competitions/:id/mergePR', verifyAuth, checkRole('judge'), competitionController.approveAndMergePR);
router.put('/competitions/:id/changeStatus', verifyAuth, competitionController.updateCompetitionStatus);
router.put('/competitions/:id/approveSubmission', verifyAuth, competitionController.approveSubmission);

module.exports = router;
