const {google} = require('googleapis');
var base64 = require('js-base64').Base64;
const cheerio = require('cheerio');
var open = require('open');
var Mailparser = require('mailparser').MailParser;

class CheckMail{

    //auth is the constructor parameter.
    constructor(auth){
        this.me = 'yoosee.camera.1152@gmail.com';
        this.gmail = google.gmail({version: 'v1', auth});
        this.auth = auth;
    }

    //Returns the mails in the user's inbox.
    checkInbox(){
        this.gmail.users.messages.list({
            userId: this.me
        }, (err, res) => {
            if(!err){
                console.log(res.data);
            }
            else{
                console.log(err);
            }
        })
    }

    listMessagesWithAttachments(callback) {
        const gmail = google.gmail({version: 'v1', auth : this.auth})
        var query = "label:yoosee is:unread";
        this.gmail.users.messages.list({
            userId: this.me,
            q: query,
            maxResults: 5
        }, (err, {data}) => {
          if (err) return console.log('Error in listMessageswithAttachments, messages list: ' + err)
          let dataForExpress = []
          let messages = data.messages;

          if (!messages) {
              callback([]);
              return;
          }

          messages.forEach(function (message, index) {
            gmail.users.messages.get({
              userId: 'me',
              id: data.messages[index].id,
              format: 'full'
            }, (err, {data}) => {
              if (err) return console.log('Error: ' + err)
                //console.log('data to push: ' + data)
                //console.log('messages.length: ' + messages.length)
                dataForExpress.push(data)
                if (dataForExpress.length == messages.length) {
                  let attachmentIds = []
                  let attachments = []
                    dataForExpress.forEach(function(message, index) {
                        //console.log('message number: ' + index)
                        //console.log(message.payload.parts)
                        let messagePayloadParts = message.payload.parts 
                        if (messagePayloadParts.length > 0) {
                            messagePayloadParts.forEach(function (part, j) {
                            //console.log('messageId: ' + JSON.stringify(message.id))
                            //console.log('message parts partId ' + JSON.stringify(part.partId))
                            //console.log('mime-type ' + JSON.stringify(part.mimeType))
                            //console.log('filename ' + JSON.stringify(part.filename))
                                let object = {}
                                if (part.body.size && part.body.size > 0 && part.body.attachmentId) {
                                    //console.log('messageId: ' + JSON.stringify(part.partId))
                                    //console.log('attachmentId ' + JSON.stringify(part.body.attachmentId))
                                    let object = {"index": `${j}`, "messageId": message.id, "attachmentId": part.body.attachmentId, filename : part.filename}
                                    attachmentIds.push(object)
                                }
                                if (dataForExpress.length - 1 == index) {
                                    attachmentIds.forEach(function (attachment, findex) {
                                        gmail.users.messages.attachments.get({
                                            userId: 'me',
                                            messageId: attachment.messageId,
                                            id: attachment.attachmentId
                                        }, (err, {data}) => {
                                            if (err) return console.log('Error getting attachment: ' + err)
                                            //console.log('attachment' + JSON.stringify(data))
                                            data.filename = attachment.filename;
                                            data.messageId = attachment.messageId;
                                            attachments.push(data)
                                            if (attachmentIds.length == attachments.length){
                                                callback(attachments);
                                            }
                                        })
                                    })   
                                }
                            })                               
                        }              
                    })
                }
            })
            })
        })
    }

    markAsRead(messageId){
        this.gmail.users.messages.modify({
            'userId': this.me,
            'id': messageId,
            'resource': {
                'addLabelIds':[],
                'removeLabelIds': ['UNREAD']
            }
        }, function(err) {
            if (err) {
                console.log(err);
                return;
            }
        });
    }

}

module.exports = CheckMail;