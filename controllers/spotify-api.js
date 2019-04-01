const spotifyWebAPI = require('spotify-web-api-node');
const _ = require('lodash');

const { CLIENT_ID, CLIENT_SECRET } = require('./config/clientConfig');

const setAPICredentials = () => {
    const swa = new spotifyWebAPI({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET
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
            //console.log(data.body.items);
            //console.log(data.body.items.length);
            for (let x = 0; x < data.body.items.length; x++) {
                //playlistArray.push(data);
                playlistArray.push(data.body.items[x].id);
            }
           // console.log(playlistArray);
            resolve(playlistArray);
            //console.log(data.body.items);
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
                            //console.log(data.body);
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
            //console.log(data.tracks.items.length);
            for(let x=0;x<data.tracks.items.length;x++){
                //console.log(data.tracks.items[x].track.artists[0].id);
                if(data.tracks.items[x].track.artists[0].id!==null){
                    if(artistList[data.tracks.items[x].track.artists[0].id])
                        artistList[data.tracks.items[x].track.artists[0].id]=artistList[data.tracks.items[x].track.artists[0].id]+1;
                    else
                        artistList[data.tracks.items[x].track.artists[0].id]=1;
                    //artistList.push(data.tracks.items[x].track.artists[0].id);
                }
            }
            //console.log(artistList);
            resolve(artistList);
            //resolve(artistList.filter(el=>el!=null));
        //console.log(data.tracks);
        })
        .catch((err)=>reject('Error'));
    })
}

const getSongGenreByArtistTO =  (playlistArray) => {
    //console.log(playlistArray);
    let genreObjectArray = [];
    return new Promise ((resolve, reject)=>{
        return setAPICredentials() 
        .then((data) => {
            //console.log(data);
           
           for(let x=0;x<playlistArray.length;x++){
               data.getArtist(playlistArray[x])
               .then(data=>{
                   //console.log(x);
                   genreObjectArray.push(data);
                   //console.log(genreObjectArray);
               })
               .catch(err=>console.log(err));
           } 
           setTimeout(()=>{
            //console.log(genreObjectArray);
            resolve(genreObjectArray);
           },500);
           
           
        })
        
        //console.log(genreObjectArray);
        // setTimeout(()=>{
        //     console.log(genreObjectArray);
        // },500);
    });
}

//Looks at an array of songs, looks at the artist of each
//and returns an array of the genre
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
                       //console.log(data.body.genres);
                        for(let genre in data.body.genres){
                            const genreName = data.body.genres[genre];
                            //console.log("Genre:"+data.body.genres[genre]);
                            if(artistAndNumber[genreName])
                                artistAndNumber[genreName]=artistAndNumber[genreName]+playlistObject[playlist];
                            else    
                                artistAndNumber[genreName]=playlistObject[playlist];
                        }
                        //artistAndNumber[data.body.genres]=playlistObject[playlist];
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
    // let object = {};
        let genreArray = [];
    //     for(let x=0;x<songGenreObject.length;x++){
    //         for(let y=0;y<songGenreObject[x].length;y++){
    //             if(object[songGenreObject[x][y]]) 
    //                 object[songGenreObject[x][y]]=object[songGenreObject[x][y]]+1;
    //             else
    //                 object[songGenreObject[x][y]]=1;
    //         }
    //     }
        //console.log(object);
        for(let x=0;x<3;x++){
            const maxVal = maxValue(songGenreObject);
            //console.log(maxVal);
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


// const getGenresByPlaylistId = async (playlistId) => {
//     const songArtists = await getSongArtists(playlistId);
//     const songGenres = await getSongGenreByArtist(songArtists);
//     const songTopGenre = await findTopThreeGenreForPlayList(songGenres);
//     //console.log(songTopGenre);
//     return songTopGenre;
// }

// getTopGenresFromPlaylistID('7MiAxFAWn5kexIQZEHoH5q').then(data=>console.log(data));

// const comeTogether = async (playlistId) => {
//     const playlistInfo ={};
//     const playlistName = await getNameAndStartDateFromPlaylistId(playlistId);
//     //console.log(playlistName);
//     //playlistInfo.top_genre = await getGenresByPlaylistId(playlistId);
//     playlistInfo.playlist_name = playlistName.playlist_name;
//     playlistInfo.playlist_start = playlistName.playlist_start;
//     playlistInfo.playlist_images = playlistName.playlist_images;
//     //console.log(playlistInfo);
//     return playlistInfo;
// }

const getPlaylistList = async (username) => {
        const playlistArray = await getAllPlayLists(username);
        //console.log([playlistArray]);
        let timelineData = playlistArray.map(async(item)=>{
            return await getNameAndStartDateFromPlaylistId(item);
        });
        
        return Promise.all(timelineData);
}

// getSongArtists('059oxJFj8LEIoGFmu6qEva').then(data=>{
//     //console.log(data);
//     // for (var playlist in data){
//     //     console.log(data[playlist]);
//     // }
//     getSongGenreByArtist(data).then(data=>{
//         //console.log(data[0]);
//         const datas=data[0];
//         console.log(findTopThreeGenreForPlayList(datas));
    
//     }).catch(err=>console.log(err));
// });

//getTopGenresFromPlaylistID('5ymXLfn3aLYnR3RtDxnenU').then(data=>console.log(data));
module.exports = {
    getPlaylistList,
    getTopGenresFromPlaylistID
}
// getAllPlayLists('pandafication').then(data=>console.log(data));

 //getPlayListById('40nCV56dL2cCAJPIuE4qVq').then((data)=>console.log(data));
//getSongArtists('6NmkSfBcaoaAFfgFX3o8yq').then(data=>{console.log(data)});
//getAllPlayLists('pandafication').then(data=>console.log(data));
// getSongArtists('3LQiSyHs139jNIIE44ywNx').then(data=>{
//     getSongGenreByArtist(data)
//     .then(data2=>{
//         const array = findTopThreeGenreForPlayList(data2);
//         console.log(array);
//     })
//     .catch(err=>console.log(err));
// })
//getNameAndStartDateFromPlaylistId('059oxJFj8LEIoGFmu6qEva').then((data)=>{});

//comeTogether('40nCV56dL2cCAJPIuE4qVq').then((data)=>{console.log(data)});

// getPlaylistList('pandafication').then(data=>
//     {
//     //console.log(data);
//     console.log(data);
// });
//searchUser('pandafication').then(data=>console.log(data.body.items[0].tracks));
// setAPICredentials().then((data)=>{
//     data.searchArtists('Ariana')
//     .then((data)=>{
//       console.log(data);
//       console.log(data.body.artists.items);
//       console.log(data.body.artists.items[0].images);
//     })
//     .catch((err)=>{
//       console.log(err);
//     });
// });


