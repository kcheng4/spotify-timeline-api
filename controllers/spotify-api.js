const spotifyWebAPI = require('spotify-web-api-node');
const _ = require('lodash');

//const { CLIENT_ID, CLIENT_SECRET } = require('./config/clientConfig');

const setAPICredentials = () => {
    const swa = new spotifyWebAPI({
        clientId: process.env.CLIENT_ID || CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET || CLIENT_SECRET
    });

    return swa.clientCredentialsGrant()
        .then((data) => {
            swa.setAccessToken(data.body['access_token']);
            return swa;
        })
        .catch((err) => {
            console.log(err);
        })
};


const searchUser = (user) => {
    return new Promise((resolve, reject) => {
        setAPICredentials()
            .then((data) => {
                data.getUserPlaylists(user,{limit:50})
                    .then((data) => {
                        if (data)
                            resolve(data);
                        else
                            reject('Error');
                    })
                    .catch((err) => console.log(err));
            });
    });
}


const getAllPlayLists = (user) => {
    let playlistArray = [];
    return new Promise((resolve, reject) => {
        searchUser(user).then((data) => {    
            for (let x = 0; x < data.body.items.length; x++) {  
                playlistArray.push(data.body.items[x].id);
            }
            resolve(playlistArray);
        })
        .catch((err)=>reject('Error'));
    })
}


const getPlayListById = (playlistId) => {
    return new Promise((resolve, reject) => {
        setAPICredentials()
            .then((data) => {
                data.getPlaylist(playlistId)
                    .then((data) => {
                        if (data){            
                            resolve(data.body);
                        }
                        else
                            reject('Error');
                    })
                    .catch((err) => console.log(err));
            });
    });
}


const getSongArtists = (playlistId) => {
    let artistList = {};
    return new Promise((resolve, reject)=>{
        getPlayListById(playlistId).then((data)=>{    
            for(let x=0;x<data.tracks.items.length;x++){
                if(data.tracks.items[x].track.artists[0].id!==null){
                    if(artistList[data.tracks.items[x].track.artists[0].id])
                        artistList[data.tracks.items[x].track.artists[0].id]=artistList[data.tracks.items[x].track.artists[0].id]+1;
                    else
                        artistList[data.tracks.items[x].track.artists[0].id]=1;          
                }
            }
            resolve(artistList);
        })
        .catch((err)=>reject('Error'));
    })
}


const getSongGenreByArtist =  (playlistObject) => {
    return new Promise ((resolve, reject)=>{
        return setAPICredentials() 
        .then((data) => {
           var promises= [];
           let artistAndNumber = {};
           
           for(let playlist in playlistObject){
               promises.push(new Promise((resolve, reject)=>{
                   data.getArtist(playlist)
                   .then(data=>{    
                        for(let genre in data.body.genres){
                            const genreName = data.body.genres[genre];   
                            if(artistAndNumber[genreName])
                                artistAndNumber[genreName]=artistAndNumber[genreName]+playlistObject[playlist];
                            else    
                                artistAndNumber[genreName]=playlistObject[playlist];
                        }
                        resolve(artistAndNumber);
                   })
                   .catch(err=>console.log(err));
               }))     
           } 
           resolve(Promise.all(promises));
        })
    });
}

const findTopThreeGenreForPlayList = (songGenreObject) =>{
   
        let genreArray = [];
   
        for(let x=0;x<3;x++){
            const maxVal = maxValue(songGenreObject);
  
            genreArray.push(maxVal);
            delete songGenreObject[maxVal];
        }
        return genreArray;
}

const maxValue= (obj)=>{
    var highest = 0;
    var arr;
    for (var prop in obj) {
        if( obj.hasOwnProperty( prop ) ) {
            if(obj[prop] > highest ){ 
                highest = obj[prop];
                arr = prop;
            }
        } 
    }
    return arr;
}

const getTopGenresFromPlaylistID = async (playlistId) => {
    const songs = await getSongArtists(playlistId);
    const songGenres = await getSongGenreByArtist(songs);
    const topGenres = findTopThreeGenreForPlayList(songGenres[0]);
    return topGenres;
}

const getNameAndStartDateFromPlaylistId = async (playlistId) => {
    
    const playlistData = await getPlayListById(playlistId);
    const playlistName = playlistData.name;
    const playlistStartDate = playlistData.tracks.items[0].added_at;
    const playlistImages = playlistData.images;
    return {
        'playlist_name':playlistName,
        'playlist_id':playlistId,
        'playlist_start':playlistStartDate,
        'playlist_images':playlistImages
    };

}


const getPlaylistList = async (username) => {
        const playlistArray = await getAllPlayLists(username);
       
        let timelineData = playlistArray.map(async(item)=>{
            return await getNameAndStartDateFromPlaylistId(item);
        });
        
        return Promise.all(timelineData);
}


module.exports = {
    getPlaylistList,
    getTopGenresFromPlaylistID
}


