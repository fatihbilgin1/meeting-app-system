const express = require('express');
const passport = require('passport');
const router = express.Router();


router.get('/google',passport.authenticate('google',{
    scope:['profile','email','https://www.googleapis.com/auth/calendar'],
    accessType:'offline',
    prompt:'consent'
}));

router.get('/google/callback',
    passport.authenticate('google',{session:false}),
    (req,res)=>{
        const token = req.user.token;
        const userId = req.user.userId;
        res.redirect(`http://localhost:8081/success?token=${token}&userId=${userId}`);
        
    }
);

module.exports = router;