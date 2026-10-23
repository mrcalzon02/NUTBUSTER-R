'use strict';
// Exchanges a one-time Play Games v2 authorization code, with NO email/profile scopes.
const {OAuth2Client}=require('google-auth-library');
async function exchangePlayerId(code){
 const clientId=process.env.PGS_SERVER_OAUTH_CLIENT_ID,secret=process.env.PGS_SERVER_OAUTH_CLIENT_SECRET;
 if(!clientId||!secret)throw Error('PGS account linking unconfigured');
 const oauth=new OAuth2Client(clientId,secret,'');
 const {tokens}=await oauth.getToken({code,redirect_uri:''});
 if(!tokens.access_token)throw Error('Missing Google access token');
 oauth.setCredentials({access_token:tokens.access_token});
 const reply=await oauth.request({url:'https://games.googleapis.com/games/v1/players/me',method:'GET'});
 const id=reply.data?.playerId;
 if(typeof id!=='string'||id.length<3||id.length>256)throw Error('Invalid Play Games player identity');
 // Throw away OAuth credentials with the request; never persist tokens/player IDs.
 return id;
}
module.exports={exchangePlayerId};
