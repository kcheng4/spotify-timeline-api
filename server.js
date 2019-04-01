const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const endpoint = require('./controllers/spotify-api');

const app = express();
const port = process.env.PORT || 3000;
console.log(process.env.NODE_ENV);

app.use(cors());
app.use(bodyParser.json());

app.get('/user/:user',(req, res) => {

    const string = req.params.user.replace("%20"," ");
   
    endpoint.getPlaylistList(string).then(data=>{
        data.sort((a,b)=>{
            return a.playlist_start<b.playlist_start ? -1 : a.playlist_start>b.playlist_start ? 1 : 0;
        });
        res.send(data);
    })
    .catch(err=>res.send('Error occurred'));
    
});

app.get('/playlist/:playlistId',(req, res) => {
    
    endpoint.getTopGenresFromPlaylistID(req.params.playlistId).then(data=>{
        res.send(data);
    })
    .catch(err=>res.send('Error occurred while trying to retrieve data'));
});

app.listen(port,()=>{
    console.log(`App running on port ${port}`);
});

module.exports = {app};
