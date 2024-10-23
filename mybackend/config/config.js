const {config} = require('dotenv');
config();

const {CLIENT_URL} = process.env;

exports.Config = {
    CLIENT_URL
}