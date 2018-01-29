import moment from 'moment';
import axios from 'axios';
import Song from '../entities/Song.js';
import SongRank from '../entities/SongRank.js';
import MediaItem from '../entities/MediaItem.js';
import ChartPosition from '../entities/ChartPosition.js';

const BASE_URL = "http://localhost:8888/api";

export default class MusicAPI {

  constructor() { }

  /**
   * Handles errors in request
   */
  static handleError = (error) => {
    var message = "Unreachable server error";
    if (error.response.data.errors[0] != undefined) {
      message = error.response.data.errors[0].details;
    }

    throw new Error(message);
  };

  /**
   * Get songs in the billboard chart in a given date
   */
  static getChart = (date) => {

    let billboard_URL = "http://localhost:9006/billboard/charts/"+ date + "?filter=song";

    return axios.get(billboard_URL)
      .then(function (res) {

        let result = res.data;
        let chart = [];

        result.forEach((chartItem) => {
          chart.push(new ChartPosition(chartItem['rank'], chartItem['song_id'], chartItem['song_name'], chartItem['display_artist']));
        });

        return chart;
      })
      .catch(function (error) {
        MusicAPI.handleError(error);
      });
  };

  /**
   * Get song information given an id
   */
  static getSongInfo = (id) => {
    //let requestUrl = BASE_URL + "/songs/" + id;
    let billboard_URL = "http://localhost:9006/billboard/music/song/"+ id;

    return axios.get(billboard_URL)
      .then(function (response) {

        let result = response.data;
        let spotify_URL = "http://localhost:9007/spotify/v1/tracks/" + response.data.song.spotify_id;

        return axios.get(spotify_URL)
          .then(function (response2) {

           let result2 = response2.data;

           let spotify_URL2 = "http://localhost:9007/spotify/v1/albums/" + response2.data.album.id;
           return axios.get(spotify_URL2)
             .then(function (response3) {
              let result3 = response3.data;
              let song = new Song(id, result2.name, result.song.display_artist,
                result2.album.name, result3.release_date, result2.duration_ms,
                result2.peview_url, result2.album.images[0].url);

              return song;
            })
             .catch(function (error) {
              MusicAPI.handleError(error);
            });

          })
          .catch(function (error) {
            MusicAPI.handleError(error);
          });

      })
      .catch(function (error) {
        MusicAPI.handleError(error);
      });
  }

  /**
   * Get historical ranks of a song given an id
   */
  static getSongRankings = (id) => {
    let requestUrl = "http://localhost:9006/billboard/music/song/" + id;

    return axios.get(requestUrl)
      .then(function (res) {
        let result = res.data;
        let rankings = [];

        result.rankings.forEach((ranking) => {
          rankings.push(new SongRank(ranking.date, ranking.rank));
        });

        return rankings;
      })
      .catch(function (error) {
        MusicAPI.handleError(error);
      });
  }

  /**
   * Get related media of a song given an id.
   */
  static getSongMedia = (id) => {
    let requestUrl = BASE_URL + "/songs/" + id + "/media?n=4";

    return axios.get(requestUrl)
      .then(function (res) {

        let result = res.data.data;
        let media = [];

        result.forEach((mediaObject) => {
          media.push(new MediaItem(mediaObject.url, mediaObject.caption, mediaObject.thumbnail));
        });

        return media;
      })
      .catch(function (error) {
        MusicAPI.handleError(error);
      });
  }
}
