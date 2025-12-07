import React, { useState } from "react";
import "./BookingForm.css";
import Logo from "../../assets/logo.png";
import { refreshToken } from "../apiClient";

const BookingForm = ({
  onBack,
  onSuccess,
  selectedDate,
  selectedTime,
  username,
  duration,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    description: "",
  });
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const durationMinutes = duration;

    const startDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(":").map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);

    const endDateTime = new Date(
      startDateTime.getTime() + durationMinutes * 60000
    );

    try {
      let token = localStorage.getItem("token");
      let response = await fetch("http://localhost:8081/api/calendar/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          summary: `${username} ile Toplantı - ${formData.name} ${formData.surname}`,
          description: formData.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          contactEmail: formData.email,
          contactPhone: formData.phone,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        const newToken = await refreshToken();
        localStorage.setItem("token", newToken);

        // Yeni token ile isteği tekrar dene
        response = await fetch("http://localhost:8081/api/calendar/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newToken}`,
          },
          body: JSON.stringify({
            summary: `${username} ile Toplantı - ${formData.name} ${formData.surname}`,
            description: formData.description,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            contactEmail: formData.email,
            contactPhone: formData.phone,
          }),
        });
      }

      if (response.ok) {
        onSuccess();
      } else {
        console.error("Toplantı oluşturulamadı");
      }
    } catch (error) {
      console.error("Sunucu hatası : ", error);
    }
  };
  return (
    <div className="booking-container">
      <div className="logo-container">
        <img src={Logo} alt="" className="app-logo" />
      </div>
      <div className="booking-form">
        <h3>Bilgileriniz</h3>
        <div className="form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="name-row">
                <div className="input-group">
                  <label htmlFor="name">Adınız *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="surname">Soyadınız *</label>
                  <input
                    type="text"
                    id="surname"
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="contact-row">
                <div className="input-group">
                  <label htmlFor="email">E-posta *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="phone">Telefon Numarası *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="description">Açıklama</label>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <div className="button-group">
                <button type="button" className="back-button" onClick={onBack}>
                  Geri Dön
                </button>
                <button type="submit" className="form-button">
                  Onayla
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
