const faq = require("./faq.js");
const plays = require("./plays.js");
const consult = require("./consult.js");

function getPlayById(playId) {
  return plays.find((item) => item.id === playId) || null;
}

function getPlaysByIds(playIds) {
  if (!Array.isArray(playIds)) {
    return [];
  }
  return playIds
    .map((playId) => getPlayById(playId))
    .filter((play) => Boolean(play));
}

function getFaqById(faqId) {
  return faq.find((item) => item.id === faqId) || null;
}

module.exports = {
  faq,
  plays,
  consultBanners: consult.banners,
  consultHeadlines: consult.headlines,
  getPlayById,
  getPlaysByIds,
  getFaqById,
  getConsultHeadlineById: consult.getHeadlineById,
};
