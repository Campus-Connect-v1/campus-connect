// Content pools for the demo seeder. Kept separate so the seeding logic stays
// readable and the data can be extended without touching it.

export const FIRST_F = ["Ama","Akosua","Abena","Adwoa","Afua","Yaa","Esi","Akua","Efua","Nana Ama","Adjoa","Serwaa","Maame","Akorfa","Dzifa","Naa","Hamdiya","Fatima","Zainab","Awo","Enyonam","Sedina","Mawusi","Abigail","Priscilla","Gifty","Comfort","Linda","Vivian","Sandra","Mabel","Cynthia","Rhoda","Selina","Eunice","Patience","Bernice","Naomi","Deborah","Hannah"];
export const FIRST_M = ["Kofi","Kwame","Yaw","Kwabena","Kojo","Kwaku","Kwesi","Fiifi","Ato","Nana Kwame","Emmanuel","Isaac","Prince","Samuel","Michael","Ibrahim","Abdul","Selorm","Kelvin","Joshua","Daniel","Nathaniel","Elikem","Sena","Kudjo","Yao","Godfred","Bright","Francis","Stephen","Ernest","Reginald","Nii","Tetteh","Mahama","Yakubu","Solomon","Felix","Clement","Gideon"];
export const LAST = ["Mensah","Owusu","Boateng","Asante","Appiah","Osei","Agyeman","Darko","Adjei","Frimpong","Ansah","Amoah","Baidoo","Quartey","Tetteh","Lartey","Nyarko","Gyasi","Bediako","Acheampong","Sarpong","Yeboah","Danso","Antwi","Addo","Abban","Aidoo","Amankwah","Asamoah","Bonsu","Dapaah","Donkor","Essien","Gyamfi","Koomson","Larbi","Nkrumah","Ofori","Opoku","Tagoe","Wiredu","Yawson","Adu","Baah","Kyei"];

export const PROGRAMS = [
  ["Computer Science","CS"],["Computer Engineering","CE"],["Information Technology","IT"],
  ["Software Engineering","CS"],["Data Science","STA"],
  ["Mechanical Engineering","ME"],["Civil Engineering","CV"],["Electrical Engineering","EE"],
  ["Geomatic Engineering","CV"],["Mining Engineering","ME"],
  ["Business Administration","BA"],["Accounting","ACC"],["Economics","ECON"],
  ["Marketing","BA"],["Banking and Finance","ACC"],
  ["Nursing","NUR"],["Medicine","MED"],["Pharmacy","PHA"],["Physician Assistantship","MED"],
  ["Architecture","ARC"],["Quantity Surveying","ARC"],
  ["Statistics","STA"],["Mathematics","MATH"],["Actuarial Science","STA"],
  ["Law","LAW"],["Political Science","LAW"],
  ["Marine Engineering","ME"],["Nautical Science","ME"],
];

export const COURSES = {
  CS: [["CS101","Introduction to Programming"],["CS201","Data Structures and Algorithms"],["CS305","Database Systems"],["CS340","Operating Systems"],["CS410","Machine Learning"],["CS350","Software Engineering"],["CS420","Distributed Systems"],["CS360","Computer Networks"]],
  CE: [["CE210","Digital Logic Design"],["CE320","Computer Architecture"],["CE330","Embedded Systems"],["CS201","Data Structures and Algorithms"],["EE120","Circuit Theory"]],
  IT: [["IT110","Web Technologies"],["IT220","Networks and Security"],["IT310","Systems Analysis"],["CS305","Database Systems"],["IT340","Cloud Computing"]],
  ME: [["ME101","Engineering Drawing"],["ME220","Thermodynamics"],["ME330","Fluid Mechanics"],["ME410","Machine Design"],["ME350","Heat Transfer"]],
  CV: [["CV150","Surveying"],["CV240","Structural Analysis"],["CV350","Geotechnical Engineering"],["CV420","Reinforced Concrete Design"],["CV310","Hydraulics"]],
  EE: [["EE120","Circuit Theory"],["EE230","Electromagnetics"],["EE340","Power Systems"],["EE430","Control Systems"],["EE310","Signals and Systems"]],
  BA: [["BA101","Principles of Management"],["BA210","Marketing Management"],["BA320","Operations Management"],["ACC101","Financial Accounting"],["BA330","Organisational Behaviour"]],
  ACC:[["ACC101","Financial Accounting"],["ACC220","Cost Accounting"],["ACC330","Auditing"],["ACC410","Taxation"],["ACC240","Corporate Finance"]],
  ECON:[["ECON101","Principles of Economics"],["ECON210","Microeconomics"],["ECON220","Macroeconomics"],["STA201","Statistics for Economists"],["ECON340","Development Economics"]],
  NUR:[["NUR110","Anatomy and Physiology"],["NUR220","Fundamentals of Nursing"],["NUR330","Community Health"],["NUR410","Medical-Surgical Nursing"],["NUR240","Pharmacology for Nurses"]],
  MED:[["MED101","Human Anatomy"],["MED210","Biochemistry"],["MED320","Pathology"],["MED430","Clinical Medicine"],["MED240","Physiology"]],
  PHA:[["PHA120","Pharmaceutical Chemistry"],["PHA230","Pharmacology"],["PHA340","Pharmaceutics"],["PHA410","Clinical Pharmacy"]],
  ARC:[["ARC101","Design Studio I"],["ARC210","History of Architecture"],["ARC320","Building Construction"],["ARC330","Environmental Design"]],
  STA:[["STA101","Introductory Statistics"],["STA210","Probability Theory"],["STA320","Regression Analysis"],["STA410","Time Series Analysis"]],
  MATH:[["MATH101","Calculus I"],["MATH201","Linear Algebra"],["MATH310","Real Analysis"],["MATH220","Differential Equations"]],
  LAW:[["LAW101","Ghana Legal System"],["LAW210","Law of Contract"],["LAW320","Constitutional Law"],["LAW330","Criminal Law"]],
};

export const INTERESTS = {
  academic: ["Research Methods","Data Analysis","Robotics","Renewable Energy","Public Health","Entrepreneurship Studies","Machine Learning","Climate Science","Urban Planning"],
  hobby: ["Photography","Creative Writing","Chess","Cooking","Board Games","Gardening","Sketching","Cycling","Hiking","Podcasting"],
  career: ["Product Management","Software Engineering","Consulting","Investment Banking","Teaching","Civil Service","Data Engineering","UX Design","Public Health Policy"],
  sports: ["Football","Basketball","Athletics","Table Tennis","Volleyball","Swimming","Badminton","Handball","Rugby"],
  arts: ["Afrobeats Production","Highlife Guitar","Drama","Dance","Spoken Word","Painting","Film Making","Fashion Design"],
};

export const BUILDINGS = [
  ["MAIN","Main Administration Block","administrative"],
  ["LIB","University Library","library"],
  ["SCI","Science Block","academic"],
  ["ENG","Engineering Block","academic"],
  ["GYM","Sports Complex","sports"],
  ["CAF","Central Cafeteria","dining"],
  ["HALL","Students' Hall of Residence","residential"],
  ["AUD","Great Hall","academic"],
  ["MEDB","Health Sciences Block","academic"],
  ["ICT","ICT Centre","academic"],
];

export const FACILITIES = [
  ["Lecture Theatre A","classroom",180],["Lecture Theatre B","classroom",140],
  ["Computer Lab 1","lab",60],["Computer Lab 2","lab",45],
  ["Electronics Lab","lab",30],["Materials Lab","lab",25],
  ["Quiet Study Room","study_room",30],["Group Study Room","study_room",12],
  ["Reading Room","library",120],["Student Lounge","lounge",50],
  ["Campus Cafe","cafe",40],["Weights Room","gym",35],
  ["Seminar Room 1","classroom",40],["Innovation Hub","study_room",24],
];

export const DEPARTMENTS = [
  ["CS","Department of Computer Science"],["EE","Department of Electrical Engineering"],
  ["ME","Department of Mechanical Engineering"],["CV","Department of Civil Engineering"],
  ["BA","Department of Business Administration"],["ACC","Department of Accounting"],
  ["ECON","Department of Economics"],["MATH","Department of Mathematics"],
  ["NUR","Department of Nursing"],["ARC","Department of Architecture"],
  ["STA","Department of Statistics"],["LAW","Faculty of Law"],
  ["PHA","Department of Pharmacy"],["IT","Department of Information Technology"],
];

// Groups confined to one campus.
export const LOCAL_GROUPS = [
  ["Algorithms Study Circle","CS101","weekly","campus"],
  ["Database Design Crew","CS305","weekly","campus"],
  ["Thermodynamics Support Group","ME220","weekly","campus"],
  ["Financial Accounting Peer Review","ACC101","biweekly","campus"],
  ["Calculus Problem Sessions","MATH101","weekly","campus"],
  ["Anatomy Revision Group","MED101","weekly","campus"],
  ["Structural Analysis Workshop","CV240","biweekly","campus"],
  ["Constitutional Law Discussions","LAW320","biweekly","campus"],
  ["Statistics Tutorial Group","STA101","weekly","campus"],
  ["Embedded Systems Builders","CE330","weekly","campus"],
  ["Marketing Case Study Team","BA210","biweekly","campus"],
  ["Pharmacology Flashcard Group","PHA230","weekly","campus"],
  ["Surveying Field Practice","CV150","monthly","campus"],
  ["Operating Systems Deep Dive","CS340","weekly","campus"],
  ["Community Health Placement Prep","NUR330","biweekly","campus"],
  ["Design Studio Crit Circle","ARC101","weekly","campus"],
  ["Circuit Theory Clinic","EE120","weekly","campus"],
  ["Microeconomics Reading Group","ECON210","biweekly","campus"],
];

// Groups that deliberately span campuses. These make the inter-school case
// testable: one university owns the row, members come from several.
export const NATIONAL_GROUPS = [
  ["Ghana Inter-University Machine Learning Circle","CS410","weekly","virtual"],
  ["National Engineering Students' Design Exchange","ME410","monthly","hybrid"],
  ["Inter-Campus Actuarial Study Network","STA320","weekly","virtual"],
  ["West Africa Moot Court Preparation","LAW210","biweekly","hybrid"],
  ["Ghana Student Robotics League","CE330","biweekly","hybrid"],
  ["Inter-University Public Health Journal Club","NUR330","weekly","virtual"],
  ["National Case Competition Training Squad","BA320","weekly","virtual"],
  ["Cross-Campus Architecture Portfolio Review","ARC210","monthly","hybrid"],
  ["Maritime and Logistics Students' Forum","ME330","monthly","hybrid"],
  ["Inter-School Data Science Practice Group","STA410","weekly","virtual"],
];

export const LOCAL_EVENTS = [
  ["Mid-Semester Revision Marathon","academic","Bring past papers. Tutors on hand for the core first-year courses."],
  ["Freshers' Welcome Mixer","social","Meet your cohort. Light refreshments provided."],
  ["Inter-Hall Football Final","sports","Supporters welcome. Kick-off prompt at the sports complex."],
  ["Career Fair: Tech and Finance","career","Recruiters from local and international firms. Bring printed CVs."],
  ["Robotics Club Open Day","club","Live demos from final-year projects."],
  ["CV and Interview Workshop","workshop","Bring a printed CV for review by the careers office."],
  ["Entrepreneurship Pitch Night","career","Five minutes to pitch, five to defend."],
  ["Study Skills Seminar","workshop","Note-taking, revision planning and exam technique."],
  ["Cultural Night","social","Food, music and drumming from every region."],
  ["Chess Tournament","club","Swiss format, five rounds, entry free."],
  ["Departmental Research Showcase","academic","Postgraduate students present current work."],
  ["Blood Donation Drive","club","Organised with the National Blood Service."],
  ["Hall Week Grand Durbar","social","The closing event of hall week."],
  ["Python for Beginners Bootcamp","workshop","Two evenings. Laptops required."],
];

export const NATIONAL_EVENTS = [
  ["Inter-University Hackathon: Build for Campus","academic","Teams of four from any Ghanaian university. 36 hours."],
  ["National Students' Debate Championship","academic","Regional heats then a final in Accra."],
  ["Ghana Universities Sports Festival","sports","Athletics, football and handball across three days."],
  ["Inter-Campus Career Summit","career","Employers meeting students from every participating institution."],
  ["National Engineering Students' Conference","academic","Keynotes, paper sessions and a site visit."],
  ["Inter-University Cultural Exchange Weekend","social","Hosted on a different campus each semester."],
];

export const POSTS = [
  "Does anyone have the CS305 past papers from last year? Happy to trade for my ME220 notes.",
  "Reminder: the library now opens at 7am during exam season. Front desk confirmed it today.",
  "Looking for two more people for the inter-university hackathon. We have a backend dev and a designer.",
  "Whoever left a blue water bottle in Computer Lab 2, it is with the lab assistant.",
  "Finally finished my structural analysis assignment. Three all-nighters. Do not recommend.",
  "Study group for Financial Accounting meets Thursday 4pm, Group Study Room. All welcome.",
  "The cafeteria jollof has genuinely improved this semester and I want that on the record.",
  "Anyone taking STA210? The Tuesday tutorial has moved to Lecture Theatre B.",
  "Selling a barely-used scientific calculator, upgraded to a graphing one. DM me.",
  "Congratulations to the robotics team for placing second nationally. Well deserved.",
  "Does the shuttle run on Saturdays? I have had two different answers from two different people.",
  "Posted my notes for the whole Thermodynamics course in the study group. Good luck everyone.",
  "Looking for a project partner for the software engineering group work. I do backend.",
  "The new quiet study room is excellent. Actually quiet, unlike the old one.",
  "Football final was a great match. Commiserations to the other hall, next year.",
  "If anyone finds a student ID with the name Kwabena on it, please hand it in at the main block.",
  "Machine learning reading group is doing attention mechanisms next week. Paper is in the group chat.",
  "Print shop near the science block is cheaper than the one on the main road, for reference.",
  "Two weeks to exams. Starting my revision timetable today and sticking to it this time.",
  "Anyone else find the lecture recordings load faster on the campus network at night?",
  "Joined a cross-campus study group last month and it has genuinely changed how I revise.",
  "Our department is hosting students from two other universities next week for the design exchange.",
  "Does anyone know if the inter-university sports festival needs volunteers? Happy to help.",
  "Rain flooded the walkway by the engineering block again. Third time this semester.",
  "Handed in my final year project proposal. Relief does not cover it.",
  "The ICT centre has extended opening hours until the end of exams. Confirmed at the desk.",
  "Anyone from another campus coming for the debate championship? Happy to show you around.",
  "Lost my notes for Circuit Theory somewhere between the lab and the hall. Long shot, but asking.",
  "Free tutoring for first-year Maths every Wednesday, organised by the student union.",
  "Whoever organised the career fair did a genuinely good job. Three interviews out of it.",
  "Looking for someone to split the cost of the design software licence for the semester.",
  "Reminder that the deadline for the national case competition entry is this Friday.",
  "The new group study rooms can be booked online now instead of queueing at the desk.",
  "Second-year Nursing placement timetables are up on the noticeboard.",
  "Anybody got a spare ticket for the cultural night? Missed the sale.",
];

export const COMMENTS = [
  "I have these, will send them over tonight.","Seconded, this was really useful.",
  "Thanks for sharing this.","Does this still apply for the evening session?",
  "Count me in.","Same experience here.","Just messaged you.",
  "This is good to know, thanks.","Can confirm.","Any chance of a copy?",
  "See you there.","Much appreciated.","Which hall is this in?",
  "I will bring my notes along.","Is it open to other campuses?",
  "Adding this to my calendar now.","Been looking for exactly this.",
  "Do we need to register first?","Happy to help organise.",
  "Saved. Thank you.","What time does it start?",
];
