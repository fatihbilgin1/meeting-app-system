const {google} = require('googleapis'); 

function getOAuthClient(accessToken,refreshToken,user){
    const OAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );
    OAuth2Client.setCredentials({
        access_token:accessToken,
        refresh_token:refreshToken
    });

    OAuth2Client.on('tokens', async (tokens) => {
    if (!user) return;
    let updated = false;

    if (tokens.access_token) {
      user.accessToken = tokens.access_token;
      updated = true;
    }
    if (tokens.refresh_token) {
      user.refreshToken = tokens.refresh_token;
      updated = true;
    }

    if (updated) {
      await user.save();
      console.log('Token güncellendi ve veritabanına kaydedildi.');
    }
  });
    return OAuth2Client;
}
module.exports = {getOAuthClient};