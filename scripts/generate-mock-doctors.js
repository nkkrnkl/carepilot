/**
 * Script to generate mock doctor/provider data for CarePilot
 * Run with: node scripts/generate-mock-doctors.js
 */

const fs = require('fs');
const path = require('path');

// Sample images from Unsplash (professional healthcare photos)
const doctorImages = [
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1594824476968-48fd8d3c9b8b?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=200&h=200&fit=crop&crop=face",
];

const specialties = [
  "Endocrinology",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Internal Medicine",
  "Family Medicine",
  "Psychiatry",
  "Oncology"
];

const firstNames = [
  "Sarah", "Michael", "Emily", "David", "Jessica", "Robert", "Jennifer",
  "James", "Maria", "John", "Patricia", "William", "Linda", "Richard",
  "Barbara", "Joseph", "Elizabeth", "Thomas", "Susan", "Christopher"
];

const lastNames = [
  "Martinez", "Chen", "Rodriguez", "Smith", "Johnson", "Williams", "Brown",
  "Jones", "Garcia", "Miller", "Davis", "Wilson", "Moore", "Taylor",
  "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin"
];

const languages = [
  ["English"],
  ["English", "Spanish"],
  ["English", "Chinese"],
  ["English", "French"],
  ["English", "Arabic"],
  ["English", "Hindi"],
  ["English", "Spanish", "Portuguese"],
  ["English", "Korean"],
  ["English", "Japanese"],
  ["English", "German"]
];

const addresses = [
  "123 Medical Center Dr, Cambridge, MA 02139",
  "456 Healthcare Ave, Boston, MA 02115",
  "789 Wellness St, Cambridge, MA 02140",
  "321 Hospital Blvd, Somerville, MA 02143",
  "654 Clinic Way, Boston, MA 02116",
  "987 Health Plaza, Cambridge, MA 02138",
  "147 Medical Park, Boston, MA 02114",
  "258 Care Circle, Somerville, MA 02144",
  "369 Wellness Center, Cambridge, MA 02141",
  "741 Medical Drive, Boston, MA 02117"
];

const reasonTemplates = [
  ["In-network with your plan", "Closest to your location", "Available next week"],
  ["In-network with your plan", "High patient ratings", "Telehealth available"],
  ["In-network with your plan", "Early morning slots", "Convenient location"],
  ["In-network with your plan", "Specialist in your condition", "Flexible scheduling"],
  ["In-network with your plan", "Multilingual provider", "Virtual visits available"]
];

function generateRandomDate(daysFromNow = 7) {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysFromNow) + 1);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  return `${dayName}, ${monthName} ${date.getDate()}`;
}

function generateTimeSlots(count = 4) {
  const times = ['8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', 
                 '11:00 AM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM'];
  const modes = ['in-person', 'telehealth'];
  
  const slots = [];
  for (let i = 0; i < count; i++) {
    slots.push({
      id: `${Date.now()}-${i}`,
      date: generateRandomDate(14),
      time: times[Math.floor(Math.random() * times.length)],
      available: Math.random() > 0.2, // 80% available
      mode: modes[Math.floor(Math.random() * modes.length)]
    });
  }
  return slots;
}

function generateDistance() {
  const distances = [1.2, 1.5, 2.3, 2.8, 3.1, 3.5, 4.1, 4.7, 5.2, 6.0];
  const distance = distances[Math.floor(Math.random() * distances.length)];
  const travelTime = Math.round(distance * 5) + Math.floor(Math.random() * 5);
  return {
    distance: `${distance} miles`,
    travelTime: `${travelTime} min drive`
  };
}

function generateMockDoctor(id) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const specialty = specialties[Math.floor(Math.random() * specialties.length)];
  const location = generateDistance();
  const providerLanguages = languages[Math.floor(Math.random() * languages.length)];
  const address = addresses[Math.floor(Math.random() * addresses.length)];
  const reasons = reasonTemplates[Math.floor(Math.random() * reasonTemplates.length)];
  const rating = (4.5 + Math.random() * 0.5).toFixed(1);
  const estimatedCost = Math.floor(30 + Math.random() * 40);
  
  // Add specialty-specific reasons
  if (specialty === "Endocrinology") {
    reasons.push("Specializes in diabetes management");
  } else if (specialty === "Cardiology") {
    reasons.push("Expert in heart conditions");
  } else if (specialty === "Pediatrics") {
    reasons.push("Child-friendly practice");
  }
  
  return {
    id: id.toString(),
    name: `Dr. ${firstName} ${lastName}`,
    specialty: specialty,
    address: address,
    distance: location.distance,
    travelTime: location.travelTime,
    languages: providerLanguages,
    telehealth: Math.random() > 0.3, // 70% offer telehealth
    inNetwork: Math.random() > 0.2, // 80% in-network
    rating: parseFloat(rating),
    image: doctorImages[Math.floor(Math.random() * doctorImages.length)],
    slots: generateTimeSlots(4 + Math.floor(Math.random() * 3)),
    reasons: reasons,
    estimatedCost: estimatedCost,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function generateMockDoctors(count = 20) {
  const doctors = [];
  for (let i = 1; i <= count; i++) {
    doctors.push(generateMockDoctor(i));
  }
  return doctors;
}

// Main execution
const doctors = generateMockDoctors(20);
const outputPath = path.join(__dirname, '../data/doctors.json');

// Ensure data directory exists
const dataDir = path.dirname(outputPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Write to file
fs.writeFileSync(outputPath, JSON.stringify(doctors, null, 2));
console.log(`✅ Generated ${doctors.length} mock doctors`);
console.log(`📁 Saved to: ${outputPath}`);
console.log(`\nSample doctor:`, JSON.stringify(doctors[0], null, 2));

