require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Course = require("./models/Course");
const Lesson = require("./models/Lesson");
const Quiz = require("./models/Quiz");

const DEMO_INSTRUCTOR = {
  name: "Demo Instructor",
  email: "demo.instructor@learnova.test",
  password: "Demo@1234",
  role: "Instructor",
};

const createLesson = (title, duration, description) => ({
  title,
  type: "Document",
  duration,
  description,
  allowDownload: true,
});

const createQuiz = (title, questions) => ({
  title,
  questions: questions.map((q) => ({
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
  })),
});

const buildCourse = ({ title, description, tags, image, lessons, quizzes }) => ({
  title,
  description,
  tags,
  image,
  responsible: "Demo Instructor",
  published: true,
  visibility: "Everyone",
  accessRule: "Open",
  lessons,
  quizzes,
});

const sampleCourses = [
  {
    title: "Frontend Foundations with React",
    description:
      "A hands-on starter course covering component thinking, state, props, routing, and common UI patterns.",
    tags: ["React", "Frontend", "JavaScript"],
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
    responsible: "Demo Instructor",
    published: true,
    visibility: "Everyone",
    accessRule: "Open",
    lessons: [
      {
        title: "Thinking in Components",
        type: "Document",
        duration: 12,
        description: "Break a screen into reusable components and define clear responsibilities.",
        allowDownload: true,
      },
      {
        title: "State, Props, and Data Flow",
        type: "Document",
        duration: 18,
        description: "Understand when data should live in parents, children, or shared stores.",
        allowDownload: true,
      },
      {
        title: "Routing a Small Learning App",
        type: "Document",
        duration: 15,
        description: "Build page-level navigation and learner flows with client-side routing.",
        allowDownload: true,
      },
    ],
    quizzes: [
      {
        title: "React Basics Checkpoint",
        questions: [
          {
            question: "What is the main purpose of props in React?",
            options: [
              "To style components globally",
              "To pass data from one component to another",
              "To connect directly to a database",
              "To replace state in every case",
            ],
            correctAnswer: 1,
          },
          {
            question: "When should you usually use state?",
            options: [
              "When a value changes over time and affects the UI",
              "For static labels that never change",
              "Only inside CSS files",
              "Only for API URLs",
            ],
            correctAnswer: 0,
          },
          {
            question: "Which React feature is commonly used for page navigation?",
            options: ["Redux", "React Router", "Tailwind CSS", "Axios interceptors"],
            correctAnswer: 1,
          },
        ],
      },
    ],
  },
  {
    title: "Node.js API Design Essentials",
    description:
      "Learn how to structure backend APIs with Express, validation, controllers, models, and practical error handling.",
    tags: ["Node.js", "Express", "Backend"],
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    responsible: "Demo Instructor",
    published: true,
    visibility: "Everyone",
    accessRule: "Open",
    lessons: [
      {
        title: "REST Endpoints and Resource Design",
        type: "Document",
        duration: 14,
        description: "Design readable endpoints that map cleanly to domain resources.",
        allowDownload: true,
      },
      {
        title: "Validation and Controller Boundaries",
        type: "Document",
        duration: 16,
        description: "Keep request validation, business rules, and persistence concerns separated.",
        allowDownload: true,
      },
      {
        title: "Error Handling That Scales",
        type: "Document",
        duration: 10,
        description: "Return consistent status codes and actionable error messages.",
        allowDownload: true,
      },
    ],
    quizzes: [
      {
        title: "API Fundamentals Quiz",
        questions: [
          {
            question: "Which HTTP method is typically used to create a new resource?",
            options: ["GET", "PATCH", "POST", "DELETE"],
            correctAnswer: 2,
          },
          {
            question: "Why validate request data before hitting the database?",
            options: [
              "To make the response slower",
              "To reduce bad input and keep logic predictable",
              "To avoid using controllers",
              "Because MongoDB cannot store strings",
            ],
            correctAnswer: 1,
          },
          {
            question: "What is a good reason to separate controllers from models?",
            options: [
              "To make files longer",
              "To mix HTTP logic into schemas",
              "To keep responsibilities clearer and easier to test",
              "To avoid using routes",
            ],
            correctAnswer: 2,
          },
        ],
      },
      {
        title: "Express Debugging Quiz",
        questions: [
          {
            question: "A 404 response usually means:",
            options: [
              "The requested route or resource was not found",
              "The server crashed permanently",
              "The database password is always wrong",
              "The user is automatically authenticated",
            ],
            correctAnswer: 0,
          },
          {
            question: "What is the benefit of centralized error handling middleware?",
            options: [
              "It duplicates every response",
              "It standardizes error responses in one place",
              "It removes the need for routes",
              "It only works for frontend apps",
            ],
            correctAnswer: 1,
          },
        ],
      },
    ],
  },
  {
    title: "Data Literacy for Product Teams",
    description:
      "A practical course for reading dashboards, framing metrics, and turning raw numbers into decisions.",
    tags: ["Analytics", "Product", "Reporting"],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    responsible: "Demo Instructor",
    published: true,
    visibility: "Everyone",
    accessRule: "Open",
    lessons: [
      {
        title: "Metrics That Actually Matter",
        type: "Document",
        duration: 11,
        description: "Differentiate vanity metrics from metrics that support product decisions.",
        allowDownload: true,
      },
      {
        title: "Reading Trends and Segments",
        type: "Document",
        duration: 13,
        description: "Interpret time series and audience slices without jumping to weak conclusions.",
        allowDownload: true,
      },
      {
        title: "Telling the Story Behind the Numbers",
        type: "Document",
        duration: 9,
        description: "Translate dashboards into concise, decision-ready summaries.",
        allowDownload: true,
      },
    ],
    quizzes: [
      {
        title: "Reporting and Metrics Quiz",
        questions: [
          {
            question: "Which metric is most useful when tracking whether learners finish a course?",
            options: [
              "Course completion rate",
              "Homepage color usage",
              "Number of browser tabs open",
              "Keyboard layout preference",
            ],
            correctAnswer: 0,
          },
          {
            question: "Why should you segment dashboard data by user group?",
            options: [
              "To hide insights",
              "To understand whether patterns differ across audiences",
              "To reduce all charts to one number",
              "To avoid comparing periods",
            ],
            correctAnswer: 1,
          },
          {
            question: "What makes a metric a vanity metric?",
            options: [
              "It is always calculated weekly",
              "It looks impressive but does not guide useful decisions",
              "It comes from a spreadsheet",
              "It is shared with managers",
            ],
            correctAnswer: 1,
          },
        ],
      },
    ],
  },
];

sampleCourses.push(
  buildCourse({
    title: "Python for Automation Workflows",
    description: "Use Python to automate repetitive tasks, process files, work with APIs, and build small utility scripts.",
    tags: ["Python", "Automation", "Scripting"],
    image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      createLesson("Writing Small Utility Scripts", 14, "Structure tiny scripts cleanly so they stay maintainable as they grow."),
      createLesson("Reading and Writing Files", 17, "Work with text, CSV, and JSON data for common operations tasks."),
      createLesson("Calling External APIs", 15, "Fetch, parse, and validate data from third-party services."),
      createLesson("Scheduling and Reliability Basics", 11, "Make automation predictable with logging, retries, and safe defaults."),
    ],
    quizzes: [
      createQuiz("Python Basics Quiz", [
        { question: "Why is Python popular for automation?", options: ["It only runs in browsers", "It has readable syntax and strong standard tooling", "It cannot work with files", "It replaces operating systems"], correctAnswer: 1 },
        { question: "Which format is commonly used for structured API responses?", options: ["JPEG", "JSON", "MP3", "PDF only"], correctAnswer: 1 },
        { question: "What helps make a script easier to debug later?", options: ["Random variable names", "No error messages", "Basic logging", "Removing outputs"], correctAnswer: 2 },
      ]),
      createQuiz("Automation Safety Quiz", [
        { question: "Why add retries carefully in automation?", options: ["To repeat failures forever", "To handle transient errors without creating runaway loops", "To remove validation", "To avoid timestamps"], correctAnswer: 1 },
        { question: "What should a file-processing script do before overwriting data?", options: ["Skip checks", "Validate paths and inputs", "Delete all folders", "Disable logs"], correctAnswer: 1 },
      ]),
    ],
  }),
  buildCourse({
    title: "UI Design Systems in Practice",
    description: "Build reusable interface patterns, tokens, components, and documentation for consistent product design.",
    tags: ["Design", "UI", "Design Systems"],
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      createLesson("Tokens, Scales, and Foundations", 13, "Define spacing, typography, and color tokens that scale cleanly."),
      createLesson("Reusable Components and Variants", 18, "Design components that support multiple states without becoming chaotic."),
      createLesson("Documenting Usage Guidelines", 10, "Capture usage rules so teams can move faster with less ambiguity."),
      createLesson("Accessibility as a System Rule", 12, "Treat contrast, focus, and semantics as first-class design decisions."),
    ],
    quizzes: [
      createQuiz("Design System Foundations Quiz", [
        { question: "What is a design token?", options: ["A one-off mockup note", "A reusable named value like color or spacing", "A browser extension", "A deployment secret"], correctAnswer: 1 },
        { question: "Why create component variants?", options: ["To handle different states and contexts consistently", "To avoid reuse", "To remove naming", "To break accessibility"], correctAnswer: 0 },
        { question: "Why does documentation matter in a design system?", options: ["It slows adoption", "It helps teams understand when and how to use components", "It replaces components", "It removes testing"], correctAnswer: 1 },
      ]),
      createQuiz("Accessibility Review Quiz", [
        { question: "Which is an accessibility concern?", options: ["Low contrast text", "Consistent spacing", "Semantic headings", "Keyboard support"], correctAnswer: 0 },
        { question: "Keyboard focus indicators are important because:", options: ["They help non-mouse users navigate interfaces", "They make pages slower", "They are only for designers", "They replace labels"], correctAnswer: 0 },
      ]),
    ],
  }),
  buildCourse({
    title: "SQL and Database Thinking",
    description: "Understand relational modeling, SQL querying, joins, aggregations, and data quality practices for product apps.",
    tags: ["SQL", "Database", "Data"],
    image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      createLesson("Tables, Keys, and Relationships", 16, "Model entities and relationships so data stays queryable and trustworthy."),
      createLesson("Filtering, Sorting, and Limits", 12, "Retrieve exactly the records you need with precise query clauses."),
      createLesson("Joins and Aggregations", 19, "Combine tables and summarize data into useful business views."),
      createLesson("Data Quality and Guardrails", 11, "Spot missing data, duplicates, and weak constraints before they hurt reporting."),
    ],
    quizzes: [
      createQuiz("SQL Basics Quiz", [
        { question: "What does a primary key do?", options: ["Identifies each row uniquely", "Styles a dashboard", "Encrypts passwords automatically", "Creates API routes"], correctAnswer: 0 },
        { question: "Which clause is commonly used to filter rows?", options: ["JOIN", "WHERE", "ORDER", "TABLE"], correctAnswer: 1 },
        { question: "Why use LIMIT in a query?", options: ["To rename columns", "To reduce the number of returned rows", "To define a primary key", "To create indexes"], correctAnswer: 1 },
      ]),
      createQuiz("Joins and Aggregation Quiz", [
        { question: "A join is used to:", options: ["Combine related data from multiple tables", "Delete a database", "Rename a server", "Replace all nulls with zero automatically"], correctAnswer: 0 },
        { question: "Which function is used to count rows in a group?", options: ["COUNT", "TOTALTEXT", "NUMBERIFY", "MERGE"], correctAnswer: 0 },
      ]),
    ],
  }),
  buildCourse({
    title: "Git and Team Collaboration",
    description: "Learn branching, pull requests, merge safety, commit hygiene, and collaborative workflows used in real teams.",
    tags: ["Git", "Version Control", "Collaboration"],
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      createLesson("Snapshots, History, and Commits", 12, "Understand what Git tracks and how commit history supports safe iteration."),
      createLesson("Branches and Pull Requests", 16, "Work in isolated branches and propose changes through readable reviews."),
      createLesson("Resolving Merge Conflicts", 15, "Handle overlapping edits without losing intent or teammate work."),
      createLesson("Commit Messages That Age Well", 9, "Write concise, meaningful history that helps future debugging."),
    ],
    quizzes: [
      createQuiz("Git Workflow Quiz", [
        { question: "Why use branches in Git?", options: ["To isolate work and reduce risk to the main line", "To speed up monitors", "To remove history", "To avoid reviews"], correctAnswer: 0 },
        { question: "What is the purpose of a pull request?", options: ["To request review before merging changes", "To delete commits automatically", "To bypass testing", "To replace version control"], correctAnswer: 0 },
        { question: "A merge conflict means:", options: ["Two changes overlap and need human resolution", "Git has stopped working forever", "The repo is corrupted", "The branch is published"], correctAnswer: 0 },
      ]),
      createQuiz("Commit Quality Quiz", [
        { question: "A strong commit message should usually be:", options: ["Clear and specific about the change", "As vague as possible", "Only emojis", "A copy of the entire diff"], correctAnswer: 0 },
        { question: "Why avoid mixing unrelated changes in one commit?", options: ["It makes review and rollback harder", "It improves readability", "It reduces merge conflicts automatically", "It changes the license"], correctAnswer: 0 },
      ]),
    ],
  }),
  buildCourse({
    title: "Product Management Fundamentals",
    description: "Practice framing problems, prioritizing work, writing requirements, and aligning delivery around outcomes.",
    tags: ["Product", "Strategy", "Planning"],
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      createLesson("Problem Framing and User Needs", 15, "Start with the user problem before jumping to solution details."),
      createLesson("Prioritization Tradeoffs", 13, "Balance impact, effort, risk, and urgency across competing bets."),
      createLesson("Writing Clear Product Requirements", 17, "Capture scope, intent, constraints, and acceptance signals."),
      createLesson("Measuring Product Outcomes", 11, "Evaluate success using meaningful behavior change, not just launch activity."),
    ],
    quizzes: [
      createQuiz("PM Core Concepts Quiz", [
        { question: "What should come first in product work?", options: ["The user problem and desired outcome", "The release party", "Random feature ideas", "The color of the button only"], correctAnswer: 0 },
        { question: "Why prioritize work explicitly?", options: ["To make tradeoffs visible and intentional", "To avoid decisions", "To eliminate constraints", "To write longer tickets"], correctAnswer: 0 },
        { question: "A good requirement should be:", options: ["Clear enough that the team understands the problem and scope", "Purposefully vague", "Only technical jargon", "Unrelated to user outcomes"], correctAnswer: 0 },
      ]),
      createQuiz("Outcome Thinking Quiz", [
        { question: "An outcome metric should help answer:", options: ["Did user behavior improve in a meaningful way?", "How many meetings were held?", "How many fonts were used?", "How many screenshots were taken?"], correctAnswer: 0 },
        { question: "Which is closer to an outcome than an output?", options: ["Users completing onboarding", "Number of shipped tickets", "Slides created", "Standups attended"], correctAnswer: 0 },
      ]),
    ],
  })
);

sampleCourses.push(
  buildCourse({
    title: "Cybersecurity Awareness for Teams",
    description: "Cover common attack patterns, password hygiene, phishing awareness, and simple safeguards for everyday work.",
    tags: ["Security", "Awareness", "Operations"],
    image: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      createLesson("Phishing and Social Engineering", 12, "Recognize manipulative messages that try to trigger rushed actions."),
      createLesson("Password Hygiene and MFA", 10, "Use stronger authentication habits that reduce account takeover risk."),
      createLesson("Handling Sensitive Information", 14, "Treat credentials, customer data, and internal docs with appropriate care."),
      createLesson("Reporting Incidents Quickly", 8, "Escalate suspicious activity early so damage can be contained faster."),
    ],
    quizzes: [
      createQuiz("Security Basics Quiz", [
        { question: "What is phishing?", options: ["A social-engineering attempt to trick users into revealing data or taking risky actions", "A database migration", "A backup method", "A CSS technique"], correctAnswer: 0 },
        { question: "Why use multi-factor authentication?", options: ["It adds another layer beyond a password", "It makes passwords public", "It removes encryption", "It only helps with Wi-Fi speed"], correctAnswer: 0 },
        { question: "What should you do with a suspicious email link?", options: ["Click it quickly", "Ignore context", "Verify before interacting", "Forward it to everyone"], correctAnswer: 2 },
      ]),
      createQuiz("Incident Response Quiz", [
        { question: "Why report suspicious behavior early?", options: ["It helps teams contain issues sooner", "It increases attacker access", "It removes logs", "It avoids MFA"], correctAnswer: 0 },
        { question: "Sensitive credentials should be:", options: ["Shared in chat", "Stored and handled securely", "Posted in screenshots", "Hardcoded publicly"], correctAnswer: 1 },
      ]),
    ],
  }),
  buildCourse({
    title: "Mobile UX Essentials",
    description: "Design mobile experiences that respect small screens, touch interactions, hierarchy, and performance constraints.",
    tags: ["Mobile", "UX", "Design"],
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      createLesson("Designing for Touch", 11, "Give interactive elements enough size and spacing for reliable touch targets."),
      createLesson("Hierarchy on Small Screens", 14, "Use layout, spacing, and copy to keep the interface readable and scannable."),
      createLesson("Navigation Patterns for Mobile", 13, "Choose tabs, drawers, and flows that fit the app’s primary jobs."),
      createLesson("Perceived Performance", 9, "Improve trust with loading states, responsiveness, and reduced friction."),
    ],
    quizzes: [
      createQuiz("Mobile Design Quiz", [
        { question: "Why do touch targets need enough size?", options: ["To reduce mis-taps and improve usability", "To slow down rendering", "To increase file size", "To remove navigation"], correctAnswer: 0 },
        { question: "On small screens, strong hierarchy helps users:", options: ["Find the most important information quickly", "See all content equally", "Ignore navigation", "Disable scrolling"], correctAnswer: 0 },
        { question: "A loading skeleton can help with:", options: ["Perceived performance", "Database encryption", "Password resets", "Cloud backups only"], correctAnswer: 0 },
      ]),
      createQuiz("Navigation Patterns Quiz", [
        { question: "Why choose navigation patterns carefully on mobile?", options: ["Because screen space and thumb reach are limited", "Because mobile devices have no users", "Because navigation is optional", "Because content never changes"], correctAnswer: 0 },
        { question: "Good mobile UX usually prioritizes:", options: ["Clarity and simplicity", "Dense hidden controls", "Tiny text", "Long unbroken forms"], correctAnswer: 0 },
      ]),
    ],
  }),
  buildCourse({
    title: "Cloud Basics for Beginners",
    description: "Get comfortable with cloud concepts like hosting, storage, scaling, environments, and managed services.",
    tags: ["Cloud", "Infrastructure", "DevOps"],
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      createLesson("What the Cloud Actually Means", 10, "Separate hype from the practical reality of hosted computing resources."),
      createLesson("Compute, Storage, and Networking", 15, "Understand the basic building blocks behind most hosted applications."),
      createLesson("Scaling and Reliability", 14, "Think about load, redundancy, and graceful degradation from the start."),
      createLesson("Managed Services and Tradeoffs", 11, "Decide when convenience is worth reduced control or higher cost."),
    ],
    quizzes: [
      createQuiz("Cloud Concepts Quiz", [
        { question: "Cloud computing usually refers to:", options: ["Using hosted computing resources over the internet", "Drawing server icons", "Only local USB storage", "Turning off data centers"], correctAnswer: 0 },
        { question: "Which is an example of storage?", options: ["Object buckets", "CPU cores only", "Keyboard layout", "Firewall colors"], correctAnswer: 0 },
        { question: "Why use managed services?", options: ["To reduce operational burden for common needs", "To remove all costs", "To eliminate architecture choices", "To avoid internet access"], correctAnswer: 0 },
      ]),
      createQuiz("Reliability Quiz", [
        { question: "Scaling is about:", options: ["Handling changes in workload effectively", "Making logos larger", "Removing backups", "Disabling monitoring"], correctAnswer: 0 },
        { question: "Redundancy can improve:", options: ["Availability", "Typos", "Meeting count", "Font selection only"], correctAnswer: 0 },
      ]),
    ],
  }),
  buildCourse({
    title: "Agile Delivery and Scrum Basics",
    description: "Explore sprint planning, standups, retrospectives, backlog hygiene, and iterative delivery habits.",
    tags: ["Agile", "Scrum", "Delivery"],
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      createLesson("Working Iteratively", 10, "Use short feedback loops to reduce risk and increase learning speed."),
      createLesson("Backlog Refinement and Priorities", 13, "Keep upcoming work clear, small enough, and connected to outcomes."),
      createLesson("Sprint Ceremonies That Matter", 14, "Run planning, standups, reviews, and retrospectives with a practical purpose."),
      createLesson("Improving Team Flow", 12, "Spot bottlenecks and improve delivery without defaulting to more meetings."),
    ],
    quizzes: [
      createQuiz("Agile Foundations Quiz", [
        { question: "Why work iteratively?", options: ["To learn and adapt faster with smaller batches", "To delay feedback", "To avoid shipping", "To increase uncertainty"], correctAnswer: 0 },
        { question: "Backlog refinement helps teams:", options: ["Prepare future work so it is better understood", "Delete all tasks", "Avoid priorities", "Remove estimates from reality"], correctAnswer: 0 },
        { question: "A retrospective is mainly for:", options: ["Reflecting on what to improve in the team’s process", "Launching marketing campaigns", "Replacing QA", "Writing database seeds"], correctAnswer: 0 },
      ]),
      createQuiz("Scrum Practices Quiz", [
        { question: "A daily standup should usually be:", options: ["Short and focused on coordination", "A one-hour architecture review", "Optional for blockers", "Only about status theatre"], correctAnswer: 0 },
        { question: "Healthy flow often improves when teams:", options: ["Limit bottlenecks and clarify handoffs", "Add random work", "Hide blockers", "Skip planning"], correctAnswer: 0 },
      ]),
    ],
  }),
  buildCourse({
    title: "Digital Marketing Analytics",
    description: "Track campaign performance, attribution basics, funnel behavior, and channel-level reporting decisions.",
    tags: ["Marketing", "Analytics", "Growth"],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      createLesson("Understanding Campaign Metrics", 12, "Read impressions, clicks, conversions, and spend in context."),
      createLesson("Funnels and Drop-Off Points", 14, "Identify where audiences lose momentum across the journey."),
      createLesson("Attribution Basics", 11, "Learn why assigning credit across channels is nuanced and imperfect."),
      createLesson("Reporting for Decision-Making", 10, "Present performance clearly so stakeholders can act with confidence."),
    ],
    quizzes: [
      createQuiz("Marketing Metrics Quiz", [
        { question: "A conversion metric helps measure:", options: ["Whether users completed a desired action", "The number of font files", "Server uptime only", "The monitor size"], correctAnswer: 0 },
        { question: "Why examine funnel drop-off?", options: ["To locate where users disengage", "To remove campaigns", "To avoid segmentation", "To ignore channels"], correctAnswer: 0 },
        { question: "Attribution is difficult because:", options: ["Users may interact with multiple channels before converting", "Marketing has no data", "Conversions do not exist", "Reports are always exact"], correctAnswer: 0 },
      ]),
      createQuiz("Channel Reporting Quiz", [
        { question: "Good reporting should help stakeholders:", options: ["Make clearer decisions", "Read more vanity metrics only", "Ignore spend", "Avoid action"], correctAnswer: 0 },
        { question: "A click-through rate compares:", options: ["Clicks to impressions", "Revenue to team size", "Signups to code lines", "Storage to uptime"], correctAnswer: 0 },
      ]),
    ],
  }),
  buildCourse({
    title: "AI Prompting and Workflow Basics",
    description: "Learn practical prompting, evaluation habits, prompt iteration, and safe human-in-the-loop workflows.",
    tags: ["AI", "Prompting", "Productivity"],
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      createLesson("Prompt Structure and Context", 11, "Give models enough context, constraints, and desired output shape to reduce ambiguity."),
      createLesson("Iterating Toward Better Results", 12, "Refine prompts based on output quality instead of expecting perfection on the first try."),
      createLesson("Evaluating Outputs Carefully", 13, "Check factuality, completeness, and fit-for-purpose before relying on generated work."),
      createLesson("Human Review and Safe Usage", 10, "Keep people in the loop where accuracy, privacy, or consequences matter."),
    ],
    quizzes: [
      createQuiz("Prompting Basics Quiz", [
        { question: "A stronger prompt usually includes:", options: ["Clear context, constraints, and desired output", "Only one vague word", "No task information", "Random punctuation"], correctAnswer: 0 },
        { question: "Why iterate on prompts?", options: ["To improve results based on what the model returned", "To make prompts shorter only", "To remove goals", "To avoid evaluation"], correctAnswer: 0 },
        { question: "When should human review stay involved?", options: ["When outputs affect important decisions or accuracy matters", "Never", "Only for colors", "Only when the model is offline"], correctAnswer: 0 },
      ]),
      createQuiz("AI Workflow Safety Quiz", [
        { question: "Why evaluate model outputs instead of trusting them blindly?", options: ["Because generated answers can be incomplete or wrong", "Because models cannot output text", "Because evaluation breaks prompts", "Because prompts replace verification"], correctAnswer: 0 },
        { question: "A human-in-the-loop workflow is useful when:", options: ["Risk or ambiguity is meaningful", "Tasks are trivial and consequence-free only", "No one needs to review", "Accuracy is irrelevant"], correctAnswer: 0 },
      ]),
    ],
  })
);

async function ensureInstructor() {
  let instructor = await User.findOne({ email: DEMO_INSTRUCTOR.email });

  if (!instructor) {
    instructor = await User.create(DEMO_INSTRUCTOR);
    console.log(`Created demo instructor: ${DEMO_INSTRUCTOR.email}`);
  } else if (instructor.role !== "Instructor") {
    instructor.role = "Instructor";
    if (DEMO_INSTRUCTOR.name && instructor.name !== DEMO_INSTRUCTOR.name) {
      instructor.name = DEMO_INSTRUCTOR.name;
    }
    await instructor.save();
    console.log(`Updated existing user to instructor: ${DEMO_INSTRUCTOR.email}`);
  } else {
    console.log(`Reusing instructor: ${DEMO_INSTRUCTOR.email}`);
  }

  return instructor;
}

async function upsertCourse(courseSeed, instructorId) {
  const {
    title,
    description,
    tags,
    image,
    responsible,
    published,
    visibility,
    accessRule,
    lessons,
    quizzes,
  } = courseSeed;

  let course = await Course.findOne({ title, createdBy: instructorId });

  if (!course) {
    course = await Course.create({
      title,
      description,
      tags,
      image: image || "",
      responsible,
      published,
      visibility,
      accessRule,
      createdBy: instructorId,
    });
    console.log(`Created course: ${title}`);
  } else {
    course.description = description;
    course.tags = tags;
    course.image = image || "";
    course.responsible = responsible;
    course.published = published;
    course.visibility = visibility;
    course.accessRule = accessRule;
    await course.save();
    console.log(`Updated course: ${title}`);
  }

  await Lesson.deleteMany({ courseId: course._id });
  await Quiz.deleteMany({ courseId: course._id });

  if (lessons.length) {
    await Lesson.insertMany(
      lessons.map((lesson, index) => ({
        ...lesson,
        courseId: course._id,
        order: index,
      }))
    );
  }

  if (quizzes.length) {
    await Quiz.insertMany(
      quizzes.map((quiz, index) => ({
        ...quiz,
        courseId: course._id,
        order: index,
      }))
    );
  }

  console.log(`Seeded ${lessons.length} lessons and ${quizzes.length} quizzes for "${title}"`);
}

async function seed() {
  await connectDB();

  try {
    const instructor = await ensureInstructor();

    for (const course of sampleCourses) {
      await upsertCourse(course, instructor._id);
    }

    console.log("Sample course data seeded successfully.");
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error) => {
  console.error("Sample seed failed:", error.message);
  process.exit(1);
});
