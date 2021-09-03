const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;

class MediaReceiver extends DefaultMediaReceiver {
  load (resource, callback) {
    const options = {
      // autoplay: true,
      currentTime: resource.startTime || 0,
    };

    const media = {
      contentId: resource.path || resource,
      contentType: 'video/mp4',
      streamType: 'BUFFERED',
      metadata: {
        type: 0,
        metadataType: 0,
        title: resource.title,
        images: [{
          url: resource.background || 'https://nerowallpaper.com/wp-content/uploads/2020/08/91518714_891039967991868_4601817192898494464_o.jpg'
        }]
      }
    }

    // if (resource.subtitles) {
    //   const tracks = [];

    //   resource.subtitles.forEach((sub, index) => {
    //     tracks.push({
    //       trackId: index,
    //       type: 'TEXT',
    //       trackContentId: sub.path,
    //       trackContentType: 'text/vtt',
    //       name: sub.name,
    //       language: sub.language,
    //       subtype: 'SUBTITLES'
    //     });
    //   });

    //   media.tracks = tracks;
    //   options.activeTrackIds = [0];
    // }

    // // Config subtitles
    // if (resource.subtitles_style) {
    //   media.textTrackStyle = resource.subtitles_style;
    // }

    DefaultMediaReceiver.prototype.load.call(this, media, options, callback);
  }
}

module.exports = MediaReceiver;