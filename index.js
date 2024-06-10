const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Main URL of the news page
const url = 'https://www.idxchannel.com/market-news';

// Function to fetch and scrape individual article data
async function fetchArticleData(articleUrl) {
    try {
        const { data } = await axios.get(articleUrl);
        const $ = cheerio.load(data);
        const title = $('.article--title.mb-20').text().trim();
        const imgSrc = $('.article--image.mb-40 img').attr('src');
        const content = $('.content').text().trim();
        // Check for "text color:" in the content
        if (content.includes('color:')) {
            return null;
        }
        return {
            title: title,
            imgSrc: imgSrc,
            content: content,
            link: articleUrl
        };
    } catch (error) {
        console.error(`Error fetching article data: ${error.message}`);
        return null;
    }
}

// Endpoint to fetch individual article data
app.post('/article', async (req, res) => {
    const articleUrl = req.body.url;
    if (!articleUrl) {
        return res.status(400).json({ error: 'URL Artikel diperlukan' });
    }

    const articleData = await fetchArticleData(articleUrl);
    if (!articleData) {
        return res.status(404).json({ error: 'Artikel tidak ditemukan atau mengandung konten terlarang' });
    }

    res.json(articleData);
});
// Endpoint to scrape data from the main news page
app.get('/news', async (req, res) => {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const articleLinks = [];

        // Find all articles and get their links
        $('div.bt-con a.thumbnail-tab--md-link').each((index, element) => {
            const articleLink = $(element).attr('href');
            if (articleLink) {
                articleLinks.push(articleLink);
            }
        });

        // Initialize an array to store the detailed news data
        const detailedNewsData = [];

        // Fetch and scrape each article's data
        for (const articleLink of articleLinks) {
            const articleData = await fetchArticleData(articleLink);
            if (articleData) {
                detailedNewsData.push(articleData);
            }
        }

        res.json(detailedNewsData);
    } catch (error) {
        console.error(`Error fetching main page data: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add a new GET endpoint to open all data at @SahaminPuh
app.get('/saham-puh', async (req, res) => {
    try {
        const folderPath = path.join(__dirname, 'SahaminPuh');
        const fileNames = fs.readdirSync(folderPath);

        const allData = {};
        for (const fileName of fileNames) {
            const filePath = path.join(folderPath, fileName);
            const data = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(data);
            const namaSaham = fileName.split('.')[0];
            allData[namaSaham] = jsonData;
        }

        res.json(allData);
    } catch (error) {
        console.error(`Error opening all data at @SahaminPuh: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
