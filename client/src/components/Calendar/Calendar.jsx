import React, { useState, useEffect } from "react";
import "./Calendar.css";
import CalendarDate from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Logo from "../../assets/logo.png";
import blankUser from "../../assets/blank-user.webp";
import { useLocation, useNavigate } from "react-router-dom";

const Calendar = ({
  username,
  onContinue,
  selectedDate,
  setSelectedDate,
  duration,
  setDuration,
}) => {
  const [selectedTime, setSelectedTime] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const userId = params.get("userId");

    // Eğer URL'de token veya userId varsa, localStorage'i GÜNCELLE
    if (token || userId) {
      // ÖNCEKİ TOKEN VE USERID'Yİ SİL (YENİ GİRİŞTE ESKİ VERİ KALMASIN)
      localStorage.removeItem("token");
      localStorage.removeItem("userId");

      // YENİ TOKEN VE USERID'Yİ KAYDET
      if (token) localStorage.setItem("token", token);
      if (userId) localStorage.setItem("userId", userId);

      // URL'DEN TOKEN VE USERID PARAMETRELERİNİ KALDIR (TEMİZ URL)
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Takvimde bugünden önceki tarihleri tıklanamaz yap
  const disablePastDates = ({ date: tileDate, view }) => {
    if (view === "month") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return tileDate < today;
    }
    return false;
  };

  // Geçmiş saatleri tıklanmaz yap
  const isTimeDisabled = (time) => {
    if (!selectedDate) return true;
    const now = new Date();
    const selectedDateTime = new Date(selectedDate);
    const [hour, minute] = time.split(":").map(Number);
    selectedDateTime.setHours(hour, minute, 0, 0);
    return selectedDateTime < now;
  };

  const handleTimeClick = (time) => {
    setSelectedTime(time);
    if (onContinue) {
      onContinue(time);
    }
  };

  return (
    <div className="calendar-container">
      <div className="logo-container">
        <img src={Logo} alt="" className="app-logo" />
      </div>
      <div className="calendar">
        <div className="calendar-left">
          <div className="calendar-user">
            <img src={blankUser} className="user-avatar" />
            <span className="user-name">{username} ile Toplantı</span>
          </div>
          <CalendarDate
            onChange={(newDate) => setSelectedDate(newDate)}
            value={selectedDate}
            tileDisabled={disablePastDates}
          />
        </div>
        <div className="calendar-right">
          <h5>Ne kadar süreye ihtiyacınız var?</h5>
          <div className="calendar-right-content">
            <div className="duration-options">
              {[
                { label: "30 dk.", value: 30 },
                { label: "15 dk.", value: 15 },
              ].map(({ label, value }) => (
                <button
                  key={label}
                  className={`duration-btn ${
                    duration === value ? "active" : ""
                  }`}
                  onClick={() => setDuration(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <h5>Hangi zaman en uygun?</h5>
          <div className="calendar-time-slots">
            {[
              "09:00",
              "09:15",
              "09:30",
              "09:45",
              "10:00",
              "10:15",
              "10:30",
              "10:45",
              "11:00",
              "11:15",
              "11:30",
              "11:45",
              "12:00",
              "12:15",
              "12:30",
              "12:45",
              "13:00",
              "13:15",
              "13:30",
              "13:45",
              "14:00",
              "14:15",
              "14:30",
              "14:45",
              "15:00",
              "15:15",
              "15:30",
              "15:45",
              "16:00",
              "16:15",
              "16:30",
              "16:45",
              "17:00",
            ].map((time, i) => (
              <button
                key={i}
                className={`time-slot-btn ${
                  selectedTime === time ? "active" : ""
                }`}
                disabled={isTimeDisabled(time)}
                onClick={() => handleTimeClick(time)}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
