/**
 * Google Calendar API Router
 * 
 * Bu router, Google Calendar API ile etkileşim için kullanılır.
 * Kullanıcıların etkinlik oluşturma, listeleme ve silme işlemlerini yönetir.
 * Tüm endpoint'ler JWT token doğrulaması gerektirir.
 */

const express = require('express');
require('dotenv').config(); 
const router = express.Router();
const {google} = require('googleapis');
const {getOAuthClient} = require('../api/googleCalendar');
const User = require('../db/models/user');
const jwt = require('jsonwebtoken');
const { version } = require('mongoose');
const sendMailToParticipants = require('../api/node-mailer');
const { text } = require('body-parser');


/**
 * JWT Token Doğrulama Middleware'i
 * İşlev:
 * - Authorization header'ından JWT token'ı alır
 * - Token'ı doğrular ve decode eder
 * - Geçerli değilse hata döndürür
 * - Başarılıysa kullanıcı ID'sini request objesine ekler
 */
function verifyToken(req,res,next){
    console.log('Authorezation Header:', req.headers.authorization);
    const token = req.headers.authorization?.split(' ')[1];
    if(!token) return res.status(401).json({message: 'Token Gerekli'});

    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.userId = decoded.id;
         console.log(`Token doğrulandı. Kullanıcı ID: ${req.userId}`);
        next();
    }
    catch(err){
        console.log('Geçersiz Token. /verifyToken')
        return res.status(403).json({message: 'Geçersiz Token'});
    }
}
/**
 * Yeni Etkinlik Oluşturma Endpoint'i
 * Parametreler (request body):
 * - summary: Etkinlik başlığı
 * - description: Etkinlik açıklaması
 * - startTime: Etkinlik başlangıç zamanı (ISO formatında)
 * - endTime: Etkinlik bitiş zamanı (ISO formatında)
 * 
 * İşlemler:
 * 1. Kullanıcıyı veritabanından bulur
 * 2. Google OAuth client'ını oluşturur
 * 3. Calendar API üzerinden yeni etkinlik oluşturur
 * 4. Oluşturulan etkinliğin ID'sini döndürür
 */
router.post('/create', verifyToken, async (req, res) => {
  const userId = req.userId;
  const { summary, description, startTime, endTime, contactEmail, contactPhone } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log('Kullanıcı Bulunamadı. /router.post');
      return res.status(404).json({ message: 'Kullanıcı Bulunamadı' });
    }

    const auth = getOAuthClient(user.accessToken, user.refreshToken, user);
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary,
      description: `${description}\n\nEmail: ${contactEmail}\nTelefon: ${contactPhone}`,
      start: {
        dateTime: startTime,
        timeZone: 'Europe/Istanbul'
      },
      end: {
        dateTime: endTime,
        timeZone: 'Europe/Istanbul',
      },
      conferenceData: {
        createRequest: {
          requestId: `${userId}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: user.calendarId || 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    const eventLink = response.data.hangoutLink || response.data.htmlLink;
    console.log('Etkinlik Oluşturuldu. /router.post');
    res.status(201).json({ message: 'Etkinlik oluşturuldu', eventId: response.data.id, meetLink: eventLink });

    const meetingDetails = `
        Toplantı Başlığı: ${summary}
        Açıklama: ${description}
        Başlangıç: ${startTime}
        Bitiş: ${endTime}
        Google Meet Linki: ${eventLink}
    `;

    await sendMailToParticipants({
      toEmails: [user.email, contactEmail],
      subject: 'Yeni Takvim Etkinliği Oluşturuldu',
      text: meetingDetails,
    });

  } catch (err) {
    console.error('Etkinlik oluşturulamadı:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});
/**
 * Etkinlikleri Listeleme Endpoint'i
 * İşlemler:
 * 1. Kullanıcıyı veritabanından bulur
 * 2. Google OAuth client'ını oluşturur
 * 3. Kullanıcının takvimindeki tüm etkinlikleri getirir
 * 4. Etkinlikleri başlangıç zamanına göre sıralayarak döndürür
 */
router.get('/events',verifyToken,async(req,res)=>{
    try{
        // Kullanıcıyı veritabanından bul
        const user = await User.findById(req.userId);
        if(!user)
        { 
            console.log('Kullanıcı Bulunamadı. /router.get')
            return res.status(404).json({message:'Kullanıcı bulunamadı'});
        }
        // Google OAuth client'ını oluştur
        const auth = getOAuthClient(user.accessToken,user.refreshToken,user);

        const calendar = google.calendar({version:'v3',auth});
        // Calendar API'den etkinlik listesini al
        const response = await calendar.events.list({
            calendarId:user.calendarId ||'primary',
            singleEvents: true,
            orderBy : 'startTime'
        });
        // Etkinlik listesini döndür
        res.status(200).json(response.data.items);
    }
    catch(err){
        console.error('Etkinlikleri alma hatası:',err.message);
        res.status(500).json({message:'Sunucu Hatası'});
    }
});
/**
 * Etkinlik Silme Endpoint'i
 * Parametreler (URL):
 * - eventId: Silinecek etkinliğin ID'si
 * 
 * İşlemler:
 * 1. Kullanıcıyı veritabanından bulur
 * 2. Google OAuth client'ını oluşturur
 * 3. Belirtilen etkinliği kullanıcının takviminden siler
 */
router.delete('/event/:eventId',verifyToken,async(req,res)=>{
    const {eventId} = req.params;
    try{
        // Kullanıcıyı veritabanından bul
        const user = await User.findById(req.userId);
        if(!user) 
        {
            console.log('Kullanıcı Bulunamadı. /router.delete')
            return res.status(404).json({message:'Kullanıcı bulunamadı.'});
        }
        // Google OAuth client'ını oluştur
        const auth = getOAuthClient(user.accessToken,user.refreshToken,user);
        
        const calendar = google.calendar({version:'v3',auth});

        // Calendar API'ye etkinlik silme isteği gönder
        await calendar.events.delete({
            calendarId:user.calendarId || 'primary',
            eventId,
        });
        console.log('Etkinlik Başarıyla Silindi');
        res.status(200).json({message:'Etkinlik başarıyla silindi.'});

    }
    catch(err){
        console.error('Etkinlik silme hatası : ',err.message);
        res.status(500).json({message:'Sunucu hatası'});

    }
});

/**
 * JWT Token Yenileme Endpoint'i
 * Parametreler (request body):
 * - userId: Kullanıcının veritabanı ID'si
 * 
 * İşlemler:
 * 1. Kullanıcıyı veritabanından bulur
 * 2. Refresh token ile Google'dan yeni access token alır
 * 3. Yeni access token'ı veritabanına kaydeder
 * 4. Yeni bir JWT token üretir ve döner
 */
router.post('/refresh', async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user || !user.refreshToken)
            return res.status(404).json({ message: 'Kullanıcı veya refreshToken bulunamadı' });

        const auth = getOAuthClient(user.accessToken, user.refreshToken);
        
        const {credentials} = await auth.refreshAccessToken();
        const newAccessToken = credentials.access_token;
        if(!newAccessToken) {
            return res.status(500).json({message:"Yeni access token alınamadı"});
        }
        user.accessToken = newAccessToken;
        await user.save();
        
        const newJwt = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.status(200).json({ token: newJwt });

    } catch (err) {
        console.error('Refresh token hatası:', err);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

/**
 *UserId ile Kullanıcı Bilgilerini Alma Endpoint'i
 * 
 */
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    res.status(200).json({
      calendarId: user.calendarId || 'primary',
      username: user.userName,
      name: user.name,
    });
  } catch (err) {
    console.error("Kullanıcı alma hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});


module.exports = router;