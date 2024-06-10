const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeNews() {
    try {
        const url = 'https://market.bisnis.com/bursa-saham';
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        
        const result = [];
        
        const newsPromises = $('.art--row a').map(async (index, element) => {
            const newsUrl = $(element).attr('href');
            const newsResponse = await axios.get(newsUrl);
            const newsHtml = cheerio.load(newsResponse.data);
            
            const title = newsHtml('.detailsTitleCaption').text();
            const date = newsHtml('.detailsAttributeDates').text().replace(/\s/g, '');
            const imageUrl = newsHtml('.detailsCoverImg.artImg a').attr('href');
            const content = newsHtml('.detailsContent.force-17.mt40 p').text();
            return { title, date, imageUrl, content };
        }).get();
        
        return Promise.all(newsPromises);
    } catch (error) {
        console.error('Error:', error);
        return { error: 'An error occurred' };
    }
}

// Example usage:
scrapeNews().then((data) => console.log(data)).catch((error) => console.error(error));
