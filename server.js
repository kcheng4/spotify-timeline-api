const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const endpoint = require('./controllers/spotify-api');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/user/:user',(req, res) => {
    console.log(req.params.user);
    const string = req.params.user.replace("%20"," ");
    console.log(string);
    endpoint.getPlaylistList(string).then(data=>{
        data.sort((a,b)=>{
            return a.playlist_start<b.playlist_start ? -1 : a.playlist_start>b.playlist_start ? 1 : 0;
        });
        res.send(data);
    })
    .catch(err=>res.send('Error occurred'));
    
});

app.get('/playlist/:playlistId',(req, res) => {
    console.log(req.params.playlistId);
    endpoint.getTopGenresFromPlaylistID(req.params.playlistId).then(data=>{
        res.send(data);
    })
    .catch(err=>res.send('Error occurred while trying to retrieve data'));
});

app.listen(8000,()=>{
    console.log('App running on port 3000');
});

