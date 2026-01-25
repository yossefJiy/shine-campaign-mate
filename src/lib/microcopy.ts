// Microcopy System - Centralized UI text for consistency
// Based on the "Smart Dashboard" product spec

export const microcopy = {
  // Dashboard Header
  dashboard: {
    greeting: "זה מה שיקדם את העסק היום",
    emptyState: "אין משימות פתוחות כרגע — זה זמן לנשום או ליזום",
    noIncomeTasksToday: "אין היום משימות שמכניסות כסף — זה זמן למכירה, ייזום או סגירה",
    projectWaiting: "הפרויקט הזה מחכה להתחלה",
  },

  // Buttons
  buttons: {
    newProposal: "➕ הצעת מחיר חדשה",
    approveStage: "✔️ אישור שלב",
    waitingForClient: "⏸️ ממתין ללקוח",
    sendReminder: "🔔 שלח תזכורת",
    markAsPaid: "💸 סמן כשולם",
    started: "▶️ התחלתי",
    goToProject: "כניסה לפרויקט",
    saveAsDraft: "שמור טיוטה",
    sendToClient: "שלח ללקוח",
    approve: "אשר",
    reject: "דחה",
    requestChanges: "בקש שינויים",
    iHaveComment: "יש לי הערה",
  },

  // Status labels
  status: {
    notStarted: "לא התחיל",
    inProgress: "בתהליך",
    waiting: "ממתין",
    completed: "הושלם",
    blocked: "חסום",
    draft: "טיוטה",
    sent: "נשלח",
    approved: "אושר",
    rejected: "נדחה",
    cancelled: "בוטל",
    open: "פתוח",
    paid: "שולם",
    overdue: "באיחור",
    partial: "חלקי",
  },

  // System messages
  messages: {
    approvalReceived: "אישור לקוח התקבל — המשימות נפתחו",
    noProgressWarning: "אין התקדמות בפרויקט הזה כבר {days} ימים",
    paymentOverdue: "התשלום הזה באיחור",
    tooManyOpenTasks: "יש יותר מדי משימות פתוחות — תבחרי אחת",
    waitingForClientDays: "ממתין כבר {days} ימים",
    projectCreatedFromProposal: "הפרויקט נוצר אוטומטית עם {stages} שלבים",
    stageApproved: "שלב אושר: {stageName}",
    reminderSent: "התזכורת נשלחה בהצלחה",
  },

  // Mindset/motivation texts
  mindset: {
    notEverythingUrgent: "לא הכול דחוף. זה כן.",
    oneTaskBetterThanFive: "משימה אחת שמסתיימת עדיפה על חמש פתוחות",
    smallProgressMatters: "התקדמות קטנה = עסק בתנועה",
    focusOnIncome: "אם תעשי רק את אלה — העסק מתקדם",
  },

  // Section titles
  sections: {
    incomeToday: "🔥 כסף היום",
    waitingForClient: "⏳ ממתין ללקוח",
    openPayments: "💸 תשלומים פתוחים",
    projectsAtRisk: "⚠️ פרויקטים בסיכון",
    alerts: "התראות",
    stages: "שלבים",
    tasks: "משימות",
    payments: "תשלומים",
    notes: "הערות",
  },

  // Task tags
  taskTags: {
    income_generating: "💸 מכניס כסף",
    operational: "⚙️ תפעולי",
    client_dependent: "👤 תלוי בלקוח",
    core: "💸 Core",
    addon: "🧩 Add-on",
  },

  // Tasks module
  tasks: {
    titleAndDescription: "כותרת ותיאור",
    assignmentAndDepartment: "שיוך ומחלקה",
    scheduleAndReminders: "תאריך, שעה ותזכורות",
    projectAndStage: "פרויקט ושלב",
    taskType: "סוג משימה",
    subtasksLabel: "תתי-משימות",
    attachmentsLabel: "נספחים",
    saveBeforeSubtasks: "שמור את המשימה כדי להוסיף תתי-משימות",
    incomeTasksFirst: "משימות שמכניסות כסף קודמות",
    taskSaved: "המשימה נשמרה",
    taskDeleted: "המשימה נמחקה",
    selectClientFirst: "יש לבחור לקוח לפני יצירת משימה",
    coreTaskHint: "💡 משימות Core הן משימות שמכניסות כסף ישירות לעסק",
    operationalHint: "משימות תפעוליות הן חיוניות אך לא מייצרות הכנסה ישירה",
    clientDependentHint: "משימה זו תלויה בתגובה או אישור מהלקוח",
    // Inbox
    inboxTitle: "תיבת דואר נכנס",
    inboxDescription: "משימות בלי פרויקט — שייכי אותן תוך 24 שעות",
    noProjectWarning: "משימה בלי פרויקט = בלאגן עתידי",
    assignToProjectCTA: "שייך לפרויקט",
    // Status Tabs
    tabInbox: "Inbox",
    tabActive: "פעילות",
    tabWaiting: "ממתינות",
    tabDone: "הושלמו",
    // Smart filters (legacy - kept for reference)
    filterMine: "שלי",
    filterIncome: "💸 מכניס כסף",
    filterWaiting: "⏳ ממתין",
    filterOverdue: "🔴 באיחור",
    // Statuses
    statusNotStarted: "לא התחיל",
    statusInProgress: "בתהליך",
    statusWaiting: "ממתין",
    statusDone: "הושלם",
    // Motivation
    oneTaskBetter: "משימה אחת שמסתיימת עדיפה על חמש פתוחות",
    noIncomeToday: "אם זה לא מכניס כסף — אל תיתן לזה להוביל את היום",
    waitingNotStuck: "ממתין ללקוח ≠ תקוע, אבל צריך מעקב",
    tooManyOpen: "אולי הגיע הזמן לסגור משהו",
  },

  // Priority labels
  priority: {
    low: "נמוך",
    medium: "בינוני",
    high: "גבוה",
    urgent: "דחוף",
  },

  // Client portal
  clientPortal: {
    welcome: "ברוכים הבאים לפורטל הלקוח",
    projectStatus: "סטטוס עבודה",
    stagesPending: "שלבים ממתינים לאישור",
    confirmAndApprove: "קראתי ואישרתי את התנאים",
    mustConfirm: "יש לאשר את התנאים לפני ההמשך",
    waitingForYourApproval: "ממתין לאישור שלך",
    stageApproved: "לקוח אישר — עכשיו מתקדמים",
    stageWaitingClient: "שלב זה ממתין לתגובה מהלקוח",
    noStages: "אין שלבים להצגה",
  },

  // Project messages
  projects: {
    campaignIsBreadAndButter: "🔥 קמפיין הוא הלחם והחמאה",
    noActivityWarning: "אין תזוזה {days} ימים — בוא נסגור חסימות",
    clientApprovedStage: "לקוח אישר שלב: {stageName}",
    stageWaitingResponse: "ממתין לתגובה מהלקוח",
    addFirstStage: "הוסף שלב ראשון",
    noStagesYet: "אין שלבים בפרויקט זה",
    moreTasks: "עוד {count} משימות",
    requestClientApproval: "בקש אישור לקוח",
    markAsCompleted: "סמן כהושלם",
    shareWithClient: "שתף עם לקוח",
    addStage: "הוסף שלב",
    addTask: "הוסף משימה",
  },

  // Proposal messages
  proposals: {
    isCommitment: "הצעה היא התחייבות — לא טיוטה בראש",
    onlyMarkedItemsCreateStages: "רק סעיפים מסומנים ייפתחו כשלבים",
    servicesForCampaign: "שירותים משלימים תמיד משרתים את הקמפיין",
    cannotEditAfterSent: "לא ניתן לערוך הצעה שנשלחה — שכפל גרסה חדשה",
    clientNoResponse: "הלקוח לא הגיב כבר {days} ימים",
    proposalApprovedProject: "הצעה אושרה — הפרויקט נפתח",
    waitingForClientApproval: "ממתין לאישור לקוח",
  },

  // Alerts
  alerts: {
    taskOverdue: "משימה באיחור",
    clientDelay: "עיכוב לקוח",
    paymentOverdue: "תשלום באיחור",
    stageApproved: "שלב אושר",
    projectStalled: "פרויקט תקוע",
    noIncomeTasks: "אין משימת כסף היום",
    proposalApproved: "הצעה אושרה",
    proposalExpired: "הצעה פגה",
    taskAssigned: "משימה שויכה",
  },
} as const;

// Helper function to replace placeholders in messages
export function formatMessage(template: string, values: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(`{${key}}`, String(value));
  }
  return result;
}

// Export type for autocomplete
export type Microcopy = typeof microcopy;
