/**
 * Google Calendar API Entegrasyonu - Sunucu Tarafı Uygulaması
 * Bu dosya Express sunucusu, MongoDB bağlantısı ve Google OAuth işlemlerini yönetir.
 * 
 */

// Gerekli modüllerin import edilmesi
const express = require('express'); // Express framework'ü başlatıyoruz
const cors = require('cors');   // Cross-Origin Resource Sharing (CORS) için
require('dotenv').config();   // Ortam değişkenleri için dotenv
const app = express();  // Express uygulaması oluşturuldu

// Veritabanı bağlantısı
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI) // MongoDB bağlantısı, bağlantı stringi .env'den alınıyor
.then(()=>console.log('Veritabanı Bağlantısı başarılı'))  // Bağlantı başarılıysa konsola yaz
.catch(err=>console.error('Veritabanı Bağlantı Hatası: ',err)); // Bağlantı hatası varsa logla

// Model ve modüller
const User = require('./db/models/user'); // Kullanıcı modelimizi yüklüyoruz
const passport = require('passport');   // Kimlik doğrulama için Passport kütüphanesi
const googleStrategy = require('passport-google-oauth20').Strategy;   // Google OAuth 2.0 stratejisi
const authRoutes = require('./routes/auth');  // Kimlik doğrulama için route'lar
const jwt = require('jsonwebtoken');  // JSON Web Token oluşturma ve doğrulama için
const calendarRoutes = require('./routes/calendar');  // Takvimle ilgili API route'ları
const morgan = require('morgan'); // HTTP istek logger'ı

// Middleware'lerin ayarlanması
app.use(morgan('dev')); // Geliştirme ortamı için logging
app.use(cors({
  origin:'http://localhost:5173',
  methods:['GET','POST','PUT','DELETE'],
  credentials:true,
  allowedHeaders:['Content-Type', 'Authorization']
})); // CORS politikaları  
app.use(express.json()); // JSON body parser
app.use(express.urlencoded({ extended: false })); // JSON body parser 

// Passport ve route'ların başlatılması
app.use(passport.initialize());
app.use('/auth', authRoutes); // Kimlik doğrulama route'ları
app.use('/api/calendar', calendarRoutes); // /api/calendar endpoint'leri calendarRoutes tarafından yönetilir

// ------------- Google OAuth 2.0 Strategy Başlangıç -------------
/**
 * Google OAuth 2.0 stratejisinin yapılandırılması
 * Kullanıcı kimlik doğrulaması ve token yönetimi
 */
// -------------Google Strategy Start-------------
passport.use(new googleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:8081/auth/google/callback',
},
  async (accessToken, refreshToken, profile, done) => {   
     // Debug için token ve profile bilgileri
    console.log('Access Token :',accessToken);
    console.log('Refresh Token:', refreshToken);
    console.log('Profile:', profile);
    
    try {
      // Kullanıcı veritabanında aranıyor
      let user = await User.findOne({ googleId: profile.id });
      let token;
      if (!user) {
        // Kullanıcı veritabanında aranıyor
        user = await User.create({
          userName: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          accessToken,
          refreshToken,
          calendarId: 'primary', // Varsayılan takvim ID'si
        });
      } else {
          // Mevcut kullanıcının token'larını güncelleme
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();
      }
      // JWT token oluşturma (1 saat geçerli)
      token = jwt.sign(
        {userId:user._id},
        process.env.JWT_SECRET,
        {expiresIn:'1h'}
      )
      return done(null, {token,userId:user._id});   // Başarılı yanıt  
    } catch (err) {
      return done(err, null); // Hata durumu
    }
  }));
// ------------- Google OAuth 2.0 Strategy Bitiş -------------



app.get("/", (req, res) => {
  return res.json("Google Calendar Api versiyonu");  
});

app.listen(8081, () => {
  console.log("sunucu 8081 portunda çalışıyor.");
});