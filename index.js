const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json()); // Add this line to parse JSON bodies

// Main URL of the news page

app.get('/news', async (req, res) => {
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
        
        const newsData = await Promise.all(newsPromises);
        res.json(newsData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
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
