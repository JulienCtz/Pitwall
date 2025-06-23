// 📂 src/services/publicId.service.js
export const generatePublicId = () => {
    const letters = Array.from({ length: 3 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
  
    const numbers = Math.floor(1000 + Math.random() * 9000);
  
    return `PIT-${letters}-${numbers}`;
  };
  