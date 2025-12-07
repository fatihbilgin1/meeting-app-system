import React from "react";
import StepIndicator from "../StepIndicator/StepIndicator";
import Logo from "../../assets/logo.png";
import "./Success.css";

const Success = ({ username, selectedDate, selectedTime }) => {
  // Tarihi "GG AA YYYY" formatına çevir
  const formattedDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString("tr-TR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="success-container">
      <div className="logo-container">
        <img src={Logo} alt="" className="app-logo" />
      </div>

      <div className="success-card">
        <div className="checkmark">&#10003;</div> {/* Tik İşareti */}
        <h2>{username} ile rezervasyonunuz oluşturuldu.</h2>
        <p>Toplantı linki e-postanıza gönderildi.</p>
        <p className="date-time">
          {formattedDate} - {selectedTime}
        </p>
      </div>
    </div>
  );
};

export default Success;
