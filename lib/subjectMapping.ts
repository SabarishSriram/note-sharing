export const subjectData: Record<string, { code: string; name: string }[]> = {
  "1": [
    { code: "CS101", name: "Engineering Mathematics I" },
    { code: "CS102", name: "Programming in C" },
    { code: "CS103", name: "Engineering Physics / Chemistry" },
    { code: "CS104", name: "Engineering Graphics" },
    { code: "CS105", name: "English Communication" }
  ],
  "2": [
    { code: "CS201", name: "Engineering Mathematics II" },
    { code: "CS202", name: "Data Structures" },
    { code: "CS203", name: "Object-Oriented Programming (C++)" }
  ],
  "3": [
    { code: "CS301", name: "Discrete Mathematics" },
    { code: "CS302", name: "Digital Logic & Computer Organization" },
    { code: "CS303", name: "Operating Systems" },
    { code: "CS304", name: "Database Management Systems" }
  ],
  "4": [
    { code: "CS401", name: "Design and Analysis of Algorithms" },
    { code: "CS402", name: "Computer Networks" },
    { code: "CS403", name: "Theory of Computation" }
  ],
  "5": [
    { code: "CS501", name: "Software Engineering" },
    { code: "CS502", name: "Web Technologies" },
    { code: "CS503", name: "Compiler Design" }
  ],
  "6": [
    { code: "CS601", name: "Fog Computing" },
    { code: "CS602", name: "Software Engineering and Project Management" },
    { code: "CS603", name: "Network Programming and IOT" }
  ],
  "7": [
    { code: "CS701", name: "Advanced Elective" },
    { code: "CS702", name: "Project Phase I" }
  ],
  "8": [
    { code: "CS801", name: "Major Project" }
  ]
};

export function getSubjectByCode(code: string) {
  for (const [semester, subjects] of Object.entries(subjectData)) {
    const subject = subjects.find(s => s.code === code);
    if (subject) return { ...subject, semester: Number(semester) };
  }
  return null;
}
