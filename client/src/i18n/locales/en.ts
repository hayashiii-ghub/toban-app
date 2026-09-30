// English UI dictionary. Template content is localized separately.
// Keys must match ja.ts exactly; the type makes a missing or extra key a type error.
import { AI_AGENTS } from "@shared/site";
import type { MessageKey } from "./ja";

export const en: Record<MessageKey, string> = {
  "lang.switchLabel": "Language",
  "lang.ja": "日本語",
  "lang.en": "English",

  "footer.about": "About toban",
  "footer.privacy": "Privacy",
  "more.aria": "More",
  "footer.maker": "shigoto.dev",

  // Common
  "common.share": "Share",
  "common.edit": "Edit",
  "common.close": "Close",

  // Rotation label (shared + Home)
  "rotation.initial": "Start",
  "rotation.nth": "Turn {n}",
  "turn.single": "Duty for {date}",
  "turn.range": "Duty for {start} – {end}",
  "turn.period": "{start} – {end}",
  "turn.startsOn": "Starts {date}",
  "turn.everyDay": "Changes every day",
  "turn.everyWeekday": "Changes every weekday",
  "turn.everyNDays": "Changes every {n} days",
  "turn.columnFrom": "From {date}",
  "shared.printHeaderDate": "{label} · Printed: {date}",

  // Shared schedule view
  "shared.printUnsupported":
    "This browser can't print. Please open the page in Safari or Chrome.",
  "shared.error.notFound": "Schedule not found",
  "shared.error.server":
    "A server error occurred. Please try again in a moment.",
  "shared.error.fetch": "Failed to load the data",
  "shared.error.network":
    "A network error occurred. Please check your connection.",
  "shared.copied": "Schedule copied",
  "shared.createYourOwn": "Create your own schedule",
  "shared.copyToMine": "Make a copy",
  "shared.printHeader": "{label} · Printed: {date}",

  // Share modal
  "shareConfirm.title": "Share this schedule?",
  "shareConfirm.message":
    'Anyone with the link will be able to view "{name}", including member names and assignments.',
  "shareConfirm.confirm": "Share schedule",
  "shareConfirm.sharing": "Sharing…",
  "shareConfirm.publishedChanged":
    '"{name}" was shared. Your current view has changed.',
  "shareConfirm.changed":
    "The schedule changed. Review it before sharing again.",

  "share.title": "Share schedule",
  "share.tabView": "👀 View only",
  "share.tabEdit": "✏️ Can edit",
  "share.descView":
    'Anyone with this link can view "{name}". It won\'t show up in search results.',
  "share.descEdit": 'Anyone with this link can edit "{name}".',
  "share.lineShare": "Share on LINE",
  "share.showQr": "Show QR code",
  "share.hideQr": "Hide QR code",
  "share.copied": "Copied",
  "share.copyUrl": "Copy link",
  "share.copiedView": "View-only link copied",
  "share.copiedEdit": "Edit link copied",
  "share.copyFailed": "Couldn't copy the link. Select it and copy it manually.",
  "share.editWarning": "Share this link only with people you trust.",
  // Keep in sync with CLEANUP_RETENTION_DAYS in server/worker.ts
  "share.retention":
    "Shared schedules are deleted automatically after one year with no edits.",

  // Landing page
  "lp.docTitle": "toban — Free Duty Roster App & Maker | Create, Print & Share",
  "lp.shareText":
    "Easy duty rosters, ready in minutes. Create rotation schedules for cleaning, lunch, and daily duties for free.",
  "lp.shareTitle": "toban | Easy Duty Rosters",
  "lp.shareToban": "Share toban",
  "lp.shareMenuClose": "Close share menu",
  "lp.shareX": "Share on X",
  "lp.urlCopied": "Link copied",
  "lp.copyFailed": "Couldn't copy",
  "lp.createSchedule": "Create a schedule",
  "lp.heroTitleA": "Easy duty rosters,",
  "lp.heroTitleB": "ready in minutes.",
  "lp.heroSubA": "Just type the names, or just ask AI.",
  "lp.heroSubB": "Make a duty roster for free, then print it or share it.",
  "lp.featuresHeading": "Why toban",
  "lp.feat.noSignup.label": "No sign-up",
  "lp.feat.noSignup.desc":
    "No Excel needed. Works right in your browser, on your phone or your computer.",
  "lp.feat.print.label": "Ready to print",
  "lp.feat.print.desc":
    "Print in four formats: cards, table, calendar, or wheel.",
  "lp.feat.share.label": "Share with a link",
  "lp.feat.share.desc": "Copy a link and send it to your group.",
  "lp.feat.free.label": "Completely free",
  "lp.feat.free.desc": "All features are free to use.",
  "lp.templatesHeading": "Ready-to-use templates",
  "lp.templatesSubtitle":
    "Pick from {count} templates and just add your members.",
  "lp.viewAllTemplates": "See all templates",
  "lp.faqHeading": "FAQ",
  "lp.hero.badge": "No sign-up · Free",
  "lp.mock.title": "Cleaning duty",
  "lp.mock.week": "Week 2",
  "lp.mock.task1": "Floors",
  "lp.mock.task2": "Trash",
  "lp.mock.task3": "Kitchen",
  "lp.mock.task4": "Windows",
  "lp.mock.member1": "Alex",
  "lp.mock.member2": "Sam",
  "lp.mock.member3": "Kim",
  "lp.mock.member4": "Lee",
  "lp.mock.askLabel": "Ask AI",
  "lp.mock.ask": '"Rotate cleaning among the 4 of us weekly"',
  "lp.ways.or": "or",
  "lp.cta.heading": "Ready to make your roster?",
  "lp.cta.sub": "No sign-up. Start right now.",
  "lp.faq.lead": "Can't find your question? Use the contact form below.",
  "lp.ways.heading": "Two ways to make one",
  "lp.ways.template.label": "From a template",
  "lp.ways.template.desc":
    "Pick one that fits, then type in your members' names.",
  "lp.ways.template.link": "Choose a template",
  "lp.ways.ai.label": "Ask AI",
  "lp.ways.ai.desc": `Open toban.app in ${AI_AGENTS.en} and describe the roster you want.`,
  "lp.ways.ai.example":
    '"Make a lunch duty roster for groups 1–6. Rotate serving, milk, and cleanup weekly, and skip weekends."',
  "lp.ways.ai.note": "Only publishing (sharing) needs your own confirmation.",

  // Contact form
  "contact.heading": "Contact",
  "contact.subtitle":
    "Bug reports, feature requests—feel free to get in touch.",
  "contact.categoryLabel": "Inquiry type",
  "contact.selectPlaceholder": "Please select",
  "contact.category.bug": "Bug report",
  "contact.category.feature": "Feature request",
  "contact.category.howTo": "How-to question",
  "contact.category.other": "Other",
  "contact.emailLabel": "Email address",
  "contact.messageLabel": "Your message",
  "contact.messagePlaceholder":
    "Bug reports, feature requests—feel free to write anything.",
  "contact.sending": "Sending…",
  "contact.submit": "Send",
  "contact.sent": "Sent",
  "contact.sentDetail":
    "Thank you for reaching out. We'll review your message and get back to you.",
  "contact.sendAnother": "Send another message",
  "contact.error": "Failed to send. Please try again in a moment.",

  // Common actions
  "common.save": "Save",
  "common.delete": "Delete",
  "common.duplicate": "Duplicate",
  "common.cancel": "Cancel",

  // New schedule modal
  "newSchedule.title": "Create a new schedule",
  "newSchedule.instruction":
    "Choose a template. You can edit everything later.",
  "newSchedule.createBlank": "Start from scratch",
  "newSchedule.createBlankDesc": "Build a schedule from a blank slate",
  "newSchedule.searchPlaceholder":
    "Search templates (e.g. lunch, cleaning, chores)",
  "newSchedule.searchAria": "Search templates",
  "newSchedule.noResults": 'No templates match "{query}"',
  "setup.back": "Choose another template",
  "setup.heading": "Add names and create",
  "setup.name": "Roster name",
  "setup.members": "Member names (one per line)",
  "setup.membersEmpty":
    "Leave empty to use the sample names ({names}…). You can edit them later.",
  "setup.nameSeparator": ", ",
  "setup.count.one": "1 person will take turns.",
  "setup.count.other": "{n} people will take turns.",
  "setup.sentenceGap": " ",
  "setup.rest": "There are {g} duties, so {r} will be off each turn.",
  "setup.double": "With {g} duties, someone will cover more than one per turn.",
  "setup.tooMany": "You can add up to {n} members.",
  "setup.rotation": "How turns change",
  "setup.preset.manual.label": "Advance by hand",
  "setup.preset.manual.desc": "Use the ◀ ▶ buttons to move to the next turn",
  "setup.preset.weekly.label": "Every Monday",
  "setup.preset.weekly.desc": "Moves on automatically by date",
  "setup.preset.weekdays.label": "Every weekday",
  "setup.preset.weekdays.desc": "Skips weekends and holidays",
  "setup.create": "Create roster",

  // Settings modal
  "settings.title": "Edit schedule",
  "settings.unsaved": "Unsaved",
  "settings.newTask": "New task",
  "settings.confirmClose": "Your changes haven't been saved. Close anyway?",
  "settings.errorNeedTask": "At least one task is required.",
  "settings.errorNeedMember": "At least one member is required.",
  "settings.maxMembersReached": "Up to {n} members allowed.",
  "settings.maxGroupsReached": "Up to {n} groups allowed.",
  "settings.maxTasksReached": "Up to {n} tasks per group allowed.",
  "settings.rotationManual": "Manual",
  "settings.rotationDate": "Automatic",
  "settings.summaryTaskMode": "{tasks} tasks · {members} people",
  "settings.summaryMemberMode": "{members} people · {groups} groups",
  "settings.sectionBasic": "Basic settings",
  "settings.scheduleName": "Schedule name",
  "settings.scheduleNamePlaceholder":
    "e.g. Office cleaning, Lunch duty, Household chores",
  "settings.chooseView": "Organize by",
  "settings.whoDoesWhat": "By member",
  "settings.whatByWhom": "By task",
  "settings.sectionDesign": "Theme",
  "settings.sectionContent": "Members and tasks",

  // Group / member / task editing
  "group.moveGroupUp": "Move group up",
  "group.moveGroupDown": "Move group down",
  "group.moveUp": "Move up",
  "group.moveDown": "Move down",
  "group.emojiOf": "Group {n} emoji",
  "group.emojiAndColorOf": "Emoji and color of group {n}",
  "group.taskNamePlaceholder": "Enter a task name",
  "group.taskNameOf": "Task {n} name",
  "group.namePlaceholder": "Enter a name",
  "group.memberNameOf": "Member {n} name",
  "group.memberName": "Member name",
  "group.deleteGroup": "Delete group {n}",
  "group.emoji": "Emoji",
  "group.changeEmoji": "Change group {n} emoji",
  "group.color": "Color",
  "group.everyone": "Everyone",
  "group.chooseMembers": "Choose members",
  "group.changeColor": "Change color",
  "group.excludeMember": "Remove {name}",
  "group.resetToAll": "Reset to all",
  "group.addMember": "Add member",
  "group.newMember": "New member",
  "group.taskAt": "Group {g} task {t}",
  "group.deleteTask": 'Delete task "{task}"',
  "group.emptyTask": "empty",
  "group.addTask": "Add task",

  // Onboarding
  "onboarding.guide": "Guide: {title}",
  "onboarding.stepAria": "Step {current}/{total}: {title} — {desc}",
  "onboarding.skip": "Skip",
  "onboarding.back": "Back",
  "onboarding.start": "Get started",
  "onboarding.next": "Next",
  "onboarding.edit.title": "Change the contents",
  "onboarding.edit.desc":
    "Edit names and duties here. You can also edit this sample and keep using it",
  "onboarding.rotation.title": "Advance the rotation",
  "onboarding.rotation.desc": "Use the arrows to move to the next turn",
  "onboarding.print.title": "Print or save as PDF",
  "onboarding.print.desc": "Print this view or save it as a PDF.",
  "onboarding.share.title": "Share with everyone",
  "onboarding.share.desc":
    "Send it on LINE or with a QR code. Only people with the link can see it",
  "onboarding.add.title": "Add and organize rosters",
  "onboarding.add.desc":
    "Select + to make a new one. Press and hold a tab (right-click on a computer) to pin, move, or delete it",

  // Rotation bar
  "rotation.prevAria": "Go to previous turn",
  "rotation.nextAria": "Advance to next turn",
  "rotation.currentAria": "Current turn: {n}",
  "rotation.autoByDate": "Rotates automatically",
  "rotation.shareAria": "Share",
  "rotation.syncError": "Backup failed",
  "rotation.editAria": "Edit schedule",

  // Rotation settings
  "rotationConfig.howToRotate": "Rotation",
  "rotationConfig.automatic": "Automatic",
  "rotationConfig.startDate": "Start date",
  "rotationConfig.cycleDays": "Rotate every",
  "rotationConfig.cycleDaysAria": "How many days between rotations",
  "rotationConfig.dayUnit": "day",
  "rotationConfig.daysUnit": "days",
  "rotationConfig.skipSat": "Skip Saturdays",
  "rotationConfig.skipSun": "Skip Sundays",
  "rotationConfig.skipHoliday": "Skip Japanese public holidays",

  // View switch / print
  "view.cards": "Cards",
  "view.table": "Table",
  "view.calendar": "Calendar",
  "view.disc": "Wheel",
  "disc.offDuty": "Off duty",
  "disc.sheetOuter": "Outer ring (tasks): cut along the outer edge.",
  "disc.sheetInner":
    "Inner disc (members): cut along the outer edge, align the centers, and attach with a pin.",
  "disc.unsupported":
    "This schedule can't be shown as a wheel. Use Table view instead.",
  "disc.unsupportedGroupPool":
    "Schedules with different members for each task group can't be shown as a wheel. Use Table view instead.",
  "disc.unsupportedTooManyTasks":
    "The wheel needs at least as many members as tasks. You have {members} members and {tasks} tasks. Combine tasks, add members, or use Table view.",
  "print.print": "Print",
  "print.printAria": "Print",

  // Home empty state
  "home.empty": "No schedules yet",
  "home.emptyHint": "Create a new schedule to get started.",
  "home.create": "Create a schedule",

  // Schedule tabs
  "tabs.navAria": "Switch schedules",
  "tabs.scrollLeft": "Scroll left",
  "tabs.scrollRight": "Scroll right",
  "tabs.tablistAria":
    "Schedule tabs (Alt+Arrow keys to reorder, Shift+F10 for the menu)",
  "tabs.tabAria": "{name} tab",
  "tabs.pinnedSuffix": " (pinned)",
  "tabs.reorderSuffix": " (Alt+Arrow keys to reorder)",
  "tabs.add": "New",
  "tabs.menuAria": 'Actions for "{name}"',
  "tabs.menu.pin": "Pin",
  "tabs.menu.unpin": "Unpin",
  "tabs.menu.moveLeft": "Move left",
  "tabs.menu.moveRight": "Move right",
  "tabs.addAria": "Add a new schedule",

  // Quick-view table
  "quickTable.heading": "Rotation overview",
  "quickTable.scrollHint": "Scroll horizontally",
  "quickTable.tableAria": "Rotation overview",
  "quickTable.assignee": "Task",

  // Card grid
  "assignments.listAria": "Assignment list",

  // Color
  "color.paletteAria": "Color selection",
  "color.colorN": "Color {n}",
  "color.custom": "Custom color",

  // Theme picker
  "legacyTheme.sunflower": "Sunflower",
  "legacyTheme.crayon": "Crayon",
  "legacyTheme.lavender": "Lavender",
  "legacyTheme.whiteboard": "Whiteboard",
  "legacyTheme.nature": "Fresh green",
  "legacyTheme.sakura": "Cherry blossom",
  "legacyTheme.nightsky": "Night sky",
  "legacyTheme.chalkboard": "Blackboard",
  "legacyTheme.ocean": "Ocean",
  "theme.compositeLabel": "{color} ({texture})",
  "theme.selectAria": "Select the {name} theme",
  "theme.forPrint": "Print-friendly",
  "theme.textureLabel": "Texture",
  "theme.colorLabel": "Color",
  "texture.sarasara": "Smooth",
  "texture.zarazara": "Textured",
  "texture.mochimochi": "Soft",

  // Theme color axis
  "themeColor.print": "Print",
  "themeColor.blackboard": "Blackboard",
  "themeColor.daidai": "Orange",
  "themeColor.sunflower": "Sunflower",
  "themeColor.hydrangea": "Hydrangea",
  "themeColor.sakura": "Cherry blossom",
  "themeColor.freshGreen": "Fresh green",
  "themeColor.sky": "Sky",
  "themeColor.nightSky": "Night sky",

  // Font selection (whole app)
  "settings.sectionFont": "Font",
  "font.appliesToRoster": "Saved with this roster and shown on shared copies",
  "font.selectAria": "Select the {name} font",
  "font.sample": "Aa Bb",
  "font.standard": "Standard",
  "font.handwriting": "Handwriting",
  "font.elegant": "Elegant",
  "font.print": "Print",

  // Bulk add
  "bulk.bulkAdd": "📋 Bulk add",
  "bulk.placeholderTask":
    "Enter member names (one per line or comma-separated)\ne.g. Alex, Sam, Riley\n(added to all tasks)",
  "bulk.placeholderMember":
    "Enter names (one per line or comma-separated)\ne.g. Alex, Sam, Riley\n(groups are created at the same time)",
  "bulk.ariaTask": "Bulk add members",
  "bulk.ariaMember": "Bulk add members and groups",
  "bulk.willAdd": "Names to add: {n}",
  "bulk.add": "Add",

  // Add-assignee (group add button)
  "group.addAssignee": "Add member",

  // Delete confirmation
  "confirmDelete.title": "Delete schedule",
  "confirmDelete.message": 'Delete "{name}"? This can\'t be undone.',
  "confirmDelete.confirm": "Delete",

  // Install prompt
  "install.promptTitle": "Install toban",
  "install.mobileDesc": "Open it right from your home screen",
  "install.desktopDesc": "Open it right from your Dock or taskbar",
  "install.add": "Add",
  "install.iosTitle": "Add to home screen",
  "install.iosDesc":
    'Tap Share (inside "…" on iOS 26) → "Add to Home Screen" to install',
  "install.macSafariTitle": "Add to Dock",
  "install.macSafariDesc": 'Choose File → "Add to Dock" to install',

  // Schedule actions
  "schedule.deleteFailed": "Failed to delete from the server",
  "schedule.copyName": "{name} (copy)",

  // 404
  "notFound.title": "Page not found",
  "notFound.message":
    "The page you're looking for doesn't exist or may have moved.",
  "notFound.home": "Home",
  "notFound.templates": "Browse templates",

  // Error boundary
  "error.unknown": "Unknown error",
  "error.unexpected": "An unexpected error occurred",
  "error.hideDetails": "Hide details",
  "error.showDetails": "Show details",
  "error.backHome": "Back to home",
  "error.reload": "Reload",

  // Edit-access transfer
  "transfer.error.notFound": "Transfer data not found",
  "transfer.error.broken":
    "The transfer URL is broken. Please get the link again.",
  "transfer.error.badFormat": "The transfer data format is invalid.",
  "transfer.error.invalidLink":
    "The edit link is invalid or the schedule was not found.",
  "transfer.error.saveFailed": "Failed to save the transfer data.",
  "transfer.updated": 'Updated edit access for "{name}"',
  "transfer.added": 'Added edit access for "{name}"',

  // Share errors
  "shareErr.publish400": "The share request was invalid",
  "shareErr.save400": "The saved content contains invalid values",
  "shareErr.auth":
    "Couldn't verify edit access. Please recreate the share link.",
  "shareErr.publish404": "Save destination not found. Please share again.",
  "shareErr.save404": "Save destination not found",
  "shareErr.publish500":
    "Saved, but publishing failed. Please try again later.",
  "shareErr.save500": "The server failed to save. Please try again later.",
  "shareErr.rateLimit": "Too many requests right now. Please try again shortly",
  "shareErr.tooLarge":
    "This schedule is too large to save. Try removing some groups or tasks",
  "shareErr.publishDefault": "Saved, but publishing failed",
  "shareErr.saveDefault":
    "Failed to save. Please check your network connection.",

  // Today banner

  // Calendar
  "cal.manualNote": "Manual mode: assignments are fixed",
  "cal.thisMonth": "This month",
  "cal.dayLabel": "{month}/{day} ({weekday})",
  "cal.wd0": "Sun",
  "cal.wd1": "Mon",
  "cal.wd2": "Tue",
  "cal.wd3": "Wed",
  "cal.wd4": "Thu",
  "cal.wd5": "Fri",
  "cal.wd6": "Sat",

  // Templates list page
  "templates.docTitle": "Duty Roster Templates | Free with toban",
  "templates.breadcrumb": "Templates",
  "templates.breadcrumbAria": "Breadcrumb",
  "templates.heading": "Duty Roster Templates",
  "templates.subA": "Ready-to-use ",
  "templates.subFree": "free templates",
  "templates.subB":
    " — {count} of them. Pick one and just edit the members and assignments to finish your roster.",

  // Template summaries
  "templateSummary.task.one": "{count} task",
  "templateSummary.task.other": "{count} tasks",
  "templateSummary.group.one": "{count} group",
  "templateSummary.group.other": "{count} groups",
  "templateSummary.member.one": "{count} person",
  "templateSummary.member.other": "{count} people",

  // Template detail page
  "templatesDetail.contents": "Template contents",
  "templatesDetail.taskN": "Task {n}",
  "templatesDetail.groupN": "Group {n}",
  "templatesDetail.memberExample": "Example members ({count})",
  "templatesDetail.editNote":
    "* Member names, counts, and colors are fully editable.",
  "templatesDetail.backToList": "Back to templates",
  "templatesDetail.related": "Related templates",
  "templatesDetail.createFromThis": "Create with this template",

  // Roster notices
  "summary.saveFailed":
    "Could not save on this device. Keep this page open and check storage space and settings to avoid losing your changes.",
};
