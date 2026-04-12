const qrData = "https://brandquest.vercel.app/qr-code?stage=0";

let stageNumber = parseInt(qrData);
console.log("Initial parseInt:", stageNumber);

if (isNaN(stageNumber) && qrData.includes("stage=")) {
    const urlObj = new URL(qrData.startsWith('http') ? qrData : `http://dummy.com/${qrData}`);
    stageNumber = parseInt(urlObj.searchParams.get("stage") || "");
}

console.log("Final stageNumber:", stageNumber);
