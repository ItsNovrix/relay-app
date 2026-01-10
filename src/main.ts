import {
  Devvit,
  Context,
  FormOnSubmitEvent,
  MenuItemOnPressEvent,
  WikiPage,
  WikiPagePermissionLevel,
} from "@devvit/public-api";
import { Paragraph } from "@devvit/shared-types/richtext/types.js";
import {
  isModerator,
  replacePlaceholders,
  getRecommendedPlaceholdersFromModAction,
  assembleRemovalReason,
  submitPostReply,
  ignoreReportsByPostId,
  setLockByPostId,
  isBanned,
} from "devvit-helpers";

Devvit.configure({
  redditAPI: true, // Enable access to the Reddit API
  modLog: false,
  http: true,
});

Devvit.addSchedulerJob({
  name: 'scheduled_post_job',
  onRun: async (event, context) => {
    const { templateNumber } = event.data!;
    const subreddit = await context.reddit.getCurrentSubreddit();
    
    const title = await context.settings.get(`postTemplate${templateNumber}title`) as string;
    const body = await context.settings.get(`postTemplate${templateNumber}body`) as string;
    const sticky = await context.settings.get(`postTemplate${templateNumber}Sticky`) as boolean;
    const lock = await context.settings.get(`postTemplate${templateNumber}Lock`) as boolean;

    if (!title) return;

    const post = await context.reddit.submitPost({
      subredditName: subreddit.name,
      title: title,
      text: body,
    });

    await post.distinguish(true);
    if (sticky) await post.sticky();
    if (lock) await post.lock();

    console.log(`Scheduled Template ${templateNumber} posted successfully!`);

    const repeat = await context.settings.get(
      `postTemplate${templateNumber}Repeat`
    ) as boolean;

    if (!repeat && event.job?.id) {
      await context.scheduler.cancelJob(event.job.id);
    }
  },
});

Devvit.addSettings([
  {
    type: "boolean",
    name: "sendModmail",
    label: "Send to Modmail?",
    helpText: `Choose this if you’d like to receive a copy in Modmail after each publish and edit (recommended for long announcements).`,
    defaultValue: true,
  },
  {
    type: "group",
    label: "Discord",
    fields: [
      {
        type: "boolean",
        name: "sendDiscord",
        label: "Send to Discord?",
        helpText: `Choose this if you’d like to receive notifications on your Discord server via webhook. Very long posts may be truncated by Discord.`,
      },
      {
        type: "string",
        name: "webhookEditor",
        label: "Webhook URL",
        helpText: `Paste your Discord webhook URL (Server Settings → Integrations → Webhooks).`,
      },
      {
        type: "string",
        name: "discordRole",
        label: "Role ID to ping",
        helpText: `Optional: paste the numeric role ID to @mention (enable “Mentionable” for that role in Discord).`,
      },
    ],
  },
  {
    type: "group",
    label: "Pinned Post Flair after posting",
    fields: [
      {
        name: "setFlairAfterPosting",
        type: "boolean",
        label: `Enable auto-flair after posting?`,
        helpText:
          "Automatically set the post’s flair right after a Relay App publish.",
        defaultValue: false,
      },
      {
        type: "string",
        name: "relayAppPostFlairText",
        label: "Flair label to apply",
        helpText: `Enter the exact flair label to apply.`,
        defaultValue: `Mod Post`,
      },
    ],
  },
  {
    type: "group",
    label: "Pinned Post Flair after commenting",
    fields: [
      {
        name: "setFlairAfterCommenting",
        type: "boolean",
        label: "Enable auto-flair after commenting?",
        helpText: `When a moderator comments via Relay App, automatically update the post’s flair.`,
        defaultValue: false,
      },
      {
        type: "string",
        name: "relayAppCommentPostFlairText",
        label: "Flair label to apply",
        helpText: `Enter the flair label to switch to after a mod replies (e.g., “Mods Replied”).`,
        defaultValue: `Mods Replied`,
      },
    ],
  },
  {
    type: "group",
    label: "Post Template 1",
    fields: [
      {
        name: "postTemplate1name",
        type: "string",
        label: "Template 1 name",
        helpText:
          "Internal name shown only in settings. Not visible to users or in posts",
        defaultValue: "First template",
      },
      {
        name: "postTemplate1title",
        type: "string",
        label: "Template 1 post title",
        helpText:
          "Prefilled title when using this template. Note: post titles can’t be edited after publishing.",
      },
      {
        name: "postTemplate1body",
        type: "paragraph",
        label: `Template 1 post body`,
        helpText:
          "Prefilled body (Markdown supported). You can still edit before publishing.",
      },
{
    name: "postTemplate1Enabled",
    type: "boolean",
    label: "Enable scheduling for Template 1?",
    helpText: "Enable this to schedule posts using Template 1.",
    defaultValue: false,
  },
      {
        name: "postTemplate1Repeat",
        type: "boolean",
        label: "Repeat weekly?",
        helpText: "If off, this will only post once at the next scheduled time.",
        defaultValue: false,
      },
      {
        name: "postTemplate1Day",
        type: "select",
        label: "Day of the week",
        options: [
          { label: "Monday", value: "1" },
          { label: "Tuesday", value: "2" },
          { label: "Wednesday", value: "3" },
          { label: "Thursday", value: "4" },
          { label: "Friday", value: "5" },
          { label: "Saturday", value: "6" },
          { label: "Sunday", value: "0" },
        ],
        defaultValue: "1",
      },
      {
        name: "postTemplate1Hour",
        type: "number",
        label: "Hour (0-23) UTC",
        helpText: "Use 24-hour format (e.g., 13 = 1 PM, 17 = 5 PM). All schedules follow UTC time.",
        defaultValue: 0,
      },
      {
        name: "postTemplate1Minute",
        type: "number",
        label: "Minute (0-59) UTC",
        helpText: "Minute of the hour (0-59). All schedules follow UTC time.",
        defaultValue: 0,
      },
      {
        name: "postTemplate1Sticky",
        type: "boolean",
        label: "Sticky the scheduled post?",
        defaultValue: false,
      },
      {
        name: "postTemplate1Lock",
        type: "boolean",
        label: "Lock the scheduled post?",
        defaultValue: false,
      },
    ],
  },
  {
    type: "group",
    label: "Post Template 2",
    fields: [
      {
        name: "postTemplate2name",
        type: "string",
        label: "Template 2 name",
        helpText:
          "Internal name shown only in settings. Not visible to users or in posts",
        defaultValue: "Second template",
      },
      {
        name: "postTemplate2title",
        type: "string",
        label: "Template 2 post title",
        helpText:
          "Prefilled title when using this template. Note: post titles can’t be edited after publishing.",
      },
      {
        name: "postTemplate2body",
        type: "paragraph",
        label: `Template 2 post body`,
        helpText:
          "Prefilled body (Markdown supported). You can still edit before publishing.",
      },
      {
        name: "postTemplate2Enabled",
        type: "boolean",
        label: "Enable scheduling for Template 2?",
        helpText: "Enable this to schedule posts using Template 2.",
        defaultValue: false,
      },
      {
        name: "postTemplate2Repeat",
        type: "boolean",
        label: "Repeat weekly?",
        helpText: "If off, this will only post once at the next scheduled time.",
        defaultValue: false,
      },
      {
        name: "postTemplate2Day",
        type: "select",
        label: "Day of the week",
        options: [
          { label: "Monday", value: "1" },
          { label: "Tuesday", value: "2" },
          { label: "Wednesday", value: "3" },
          { label: "Thursday", value: "4" },
          { label: "Friday", value: "5" },
          { label: "Saturday", value: "6" },
          { label: "Sunday", value: "0" },
        ],
        defaultValue: "1",
      },
      {
        name: "postTemplate2Hour",
        type: "number",
        label: "Hour (0-23) UTC",
        helpText: "Use 24-hour format (e.g., 13 = 1 PM, 17 = 5 PM). All schedules follow UTC time.",
        defaultValue: 0,
      },
      {
        name: "postTemplate2Minute",
        type: "number",
        label: "Minute (0-59) UTC",
        helpText: "Minute of the hour (0-59). All schedules follow UTC time.",
        defaultValue: 0,
      },
      {
        name: "postTemplate2Sticky",
        type: "boolean",
        label: "Sticky the scheduled post?",
        defaultValue: false,
      },
      {
        name: "postTemplate2Lock",
        type: "boolean",
        label: "Lock the scheduled post?",
        defaultValue: false,
      },
    ],
  },
  {
    type: "group",
    label: "Post Template 3",
    fields: [
      {
        name: "postTemplate3name",
        type: "string",
        label: "Template 3 name",
        helpText:
          "Internal name shown only in settings. Not visible to users or in posts",
        defaultValue: "Third template",
      },
      {
        name: "postTemplate3title",
        type: "string",
        label: "Template 3 post title",
        helpText:
          "Prefilled title when using this template. Note: post titles can’t be edited after publishing.",
      },
      {
        name: "postTemplate3body",
        type: "paragraph",
        label: `Template 3 post body`,
        helpText:
          "Prefilled body (Markdown supported). You can still edit before publishing.",
      },
      {
        name: "postTemplate3Enabled",
        type: "boolean",
        label: "Enable scheduling for Template 3?",
        helpText: "Enable this to schedule posts using Template 3.",
        defaultValue: false,
      },
      {
        name: "postTemplate3Repeat",
        type: "boolean",
        label: "Repeat weekly?",
        helpText: "If off, this will only post once at the next scheduled time.",
        defaultValue: false,
      },
      {
        name: "postTemplate3Day",
        type: "select",
        label: "Day of the week",
        options: [
          { label: "Monday", value: "1" },
          { label: "Tuesday", value: "2" },
          { label: "Wednesday", value: "3" },
          { label: "Thursday", value: "4" },
          { label: "Friday", value: "5" },
          { label: "Saturday", value: "6" },
          { label: "Sunday", value: "0" },
        ],
        defaultValue: "1",
      },
      {
        name: "postTemplate3Hour",
        type: "number",
        label: "Hour (0-23) UTC",
        helpText: "Use 24-hour format (e.g., 13 = 1 PM, 17 = 5 PM). All schedules follow UTC time.",
        defaultValue: 0,
      },
      {
        name: "postTemplate3Minute",
        type: "number",
        label: "Minute (0-59) UTC",
        helpText: "Minute of the hour (0-59). All schedules follow UTC time.",
        defaultValue: 0,
      },
      {
        name: "postTemplate3Sticky",
        type: "boolean",
        label: "Sticky the scheduled post?",
        defaultValue: false,
      },
      {
        name: "postTemplate3Lock",
        type: "boolean",
        label: "Lock the scheduled post?",
        defaultValue: false,
      },
    ],
  },
  {
    type: "group",
    label: "Post Template 4",
    fields: [
      {
        name: "postTemplate4name",
        type: "string",
        label: "Template 4 name",
        helpText:
          "Internal name shown only in settings. Not visible to users or in posts",
        defaultValue: "Fourth template",
      },
      {
        name: "postTemplate4title",
        type: "string",
        label: "Template 4 post title",
        helpText:
          "Prefilled title when using this template. Note: post titles can’t be edited after publishing.",
      },
      {
        name: "postTemplate4body",
        type: "paragraph",
        label: `Template 4 post body`,
        helpText:
          "Prefilled body (Markdown supported). You can still edit before publishing.",
      },
      {
        name: "postTemplate4Enabled",
        type: "boolean",
        label: "Enable scheduling for Template 4?",
        helpText: "Enable this to schedule posts using Template 4.",
        defaultValue: false,
      },
      {
        name: "postTemplate4Repeat",
        type: "boolean",
        label: "Repeat weekly?",
        helpText: "If off, this will only post once at the next scheduled time.",
        defaultValue: false,
      },
      {
        name: "postTemplate4Day",
        type: "select",
        label: "Day of the week",
        options: [
          { label: "Monday", value: "1" },
          { label: "Tuesday", value: "2" },
          { label: "Wednesday", value: "3" },
          { label: "Thursday", value: "4" },
          { label: "Friday", value: "5" },
          { label: "Saturday", value: "6" },
          { label: "Sunday", value: "0" },
        ],
        defaultValue: "1",
      },
      {
        name: "postTemplate4Hour",
        type: "number",
        label: "Hour (0-23) UTC",
        helpText: "Use 24-hour format (e.g., 13 = 1 PM, 17 = 5 PM). All schedules follow UTC time.",
        defaultValue: 0,
      },
      {
        name: "postTemplate4Minute",
        type: "number",
        label: "Minute (0-59) UTC",
        helpText: "Minute of the hour (0-59). All schedules follow UTC time.",
        defaultValue: 0,
      },
      {
        name: "postTemplate4Sticky",
        type: "boolean",
        label: "Sticky the scheduled post?",
        defaultValue: false,
      },
      {
        name: "postTemplate4Lock",
        type: "boolean",
        label: "Lock the scheduled post?",
        defaultValue: false,
      },
    ],
  },
  {
    type: "group",
    label: "Post Template 5",
    fields: [
      {
        name: "postTemplate5name",
        type: "string",
        label: "Template 5 name",
        helpText:
          "Internal name shown only in settings. Not visible to users or in posts",
        defaultValue: "Fifth template",
      },
      {
        name: "postTemplate5title",
        type: "string",
        label: "Template 5 post title",
        helpText:
          "Prefilled title when using this template. Note: post titles can’t be edited after publishing.",
      },
      {
        name: "postTemplate5body",
        type: "paragraph",
        label: `Template 5 post body`,
        helpText:
          "Prefilled body (Markdown supported). You can still edit before publishing.",
      },
      {
        name: "postTemplate5Enabled",
        type: "boolean",
        label: "Enable scheduling for Template 5?",
        helpText: "Enable this to schedule posts using Template 5.",
        defaultValue: false,
      },
      {
        name: "postTemplate5Repeat",
        type: "boolean",
        label: "Repeat weekly?",
        helpText: "If off, this will only post once at the next scheduled time.",
        defaultValue: false,
      },
      {
        name: "postTemplate5Day",
        type: "select",
        label: "Day of the week",
        options: [
          { label: "Monday", value: "1" },
          { label: "Tuesday", value: "2" },
          { label: "Wednesday", value: "3" },
          { label: "Thursday", value: "4" },
          { label: "Friday", value: "5" },
          { label: "Saturday", value: "6" },
          { label: "Sunday", value: "0" },
        ],
        defaultValue: "1",
      },
      {
        name: "postTemplate5Hour",
        type: "number",
        label: "Hour (0-23) UTC",
        helpText: "Use 24-hour format (e.g., 13 = 1 PM, 17 = 5 PM). All schedules follow UTC time.",
        defaultValue: 0,
      },
      {
        name: "postTemplate5Minute",
        type: "number",
        label: "Minute (0-59) UTC",
        helpText: "Minute of the hour (0-59). All schedules follow UTC time.",
        defaultValue: 0,
      },
      {
        name: "postTemplate5Sticky",
        type: "boolean",
        label: "Sticky the scheduled post?",
        defaultValue: false,
      },
      {
        name: "postTemplate5Lock",
        type: "boolean",
        label: "Lock the scheduled post?",
        defaultValue: false,
      },
    ],
  },
]),

Devvit.addTrigger({
  event: "AppInstall",
  async onEvent(event, context) {
    console.log(`App installed on r/${event.subreddit?.name}.`);

    const subreddit = await context.reddit.getCurrentSubreddit();
    const appAccount = await context.reddit.getAppUser();

    var firstMsg = `Hello r/${subreddit.name} mods,\n\n`;

    ((firstMsg += `Thanks for installing **Relay App**!\n\n`),
      (firstMsg += `This tool helps your team publish and manage official mod posts and pinned mod comments — fast, consistent, and without shared accounts.\n\n`));

    /* QUICK START */
    ((firstMsg += `**How to use it:**\n\n\n`),
      (firstMsg += `1) Open **Relay App → New Post** (or **New Comment**)\n`),
      (firstMsg += `2) Write your content, toggle **Distinguish** / **Sticky** as needed\n`),
      (firstMsg += `3) **Publish** — done!\n\n`),
      (firstMsg += `*Note:* Post **titles cannot be edited** after publishing (Reddit limitation). Double-check before you post.\n\n`));

    /* DEFAULTS & NOTIFICATIONS */
    ((firstMsg += `**Defaults & notifications:**\n\n\n`),
      (firstMsg += `- An **internal mod note** is added automatically after each publish (shows who posted + direct link).\n`),
      (firstMsg += `- **Modmail notifications are ON by default** on submit and on edit of a mod post — great for long announcements so the team always has a copy.\n`),
      (firstMsg += `- **Discord notifications** are supported if you add a webhook in settings. Heads-up: very long posts may hit Discord payload limits.\n\n`));

    /* FEATURES */
    ((firstMsg += `**Features you can use today:**\n\n\n`),
      (firstMsg += `- Publish **official mod posts** (text) with one-click **Distinguish**, **Sticky**, and **Lock**.\n`),
      (firstMsg += `- Publish **pinned mod comments** (also with **Distinguish**, **Sticky**, and **Lock**).\n`),
      (firstMsg += `- **Auto-flair after posting** — automatically apply a flair (e.g., *Mod Post*) to posts created via Relay App.\n`),
      (firstMsg += `- **Auto-flair after commenting** — when a **mod replies via Relay App**, the post flair can auto-switch (e.g., *Mods Replied*).\n`),
      (firstMsg += `- **Post Templates** — save up to **5** reusable templates per subreddit. Add them in settings, then select **Use template** when creating a post.\n`),
      (firstMsg += `- Schedule up to **5** post templates to automatically publish at specific times weekly (with optional **Sticky** and **Lock**).\n`),
      (firstMsg += `- **Clone Post** — click **Clone** on any previous post to rapidly reuse it (perfect for monthly stickies & AMA re-runs).\n`),
      (firstMsg += `- **Permanent delete** of posts/comments created via the app (not just remove) — use with care.\n`),
      (firstMsg += `- Permissions required: **Post** or **Everything**.\n\n`));

    /* CONFIG LINKS */
    ((firstMsg += `**Configure now:** manage templates, auto-flair, and Discord here → `),
      (firstMsg += `[ Relay App settings](https://developers.reddit.com/r/${subreddit.name}/apps/relay-app)\n\n`));

    /* FOOTER */
    ((firstMsg += `[Terms & Conditions](https://www.reddit.com/r/RelayLabs/wiki/terms-and-conditions/) | `),
      (firstMsg += `[Privacy Policy](https://www.reddit.com/r/RelayLabs/wiki/privacy-policy/) | `),
      (firstMsg += `[Contact](https://reddit.com/r/RelayLabs)\n\n`));

    await context.reddit.sendPrivateMessageAsSubreddit({
      fromSubredditName: subreddit.name,
      to: "relay-app",
      subject: `Thanks for installing Relay App!`,
      text: firstMsg,
    });
    console.log(`Message sent to r/${event.subreddit?.name} mods.`);

    await context.reddit.setUserFlair({
      subredditName: subreddit.name,
      username: appAccount.username,
      text: "Mod Bot 🤖",
      textColor: "light",
      backgroundColor: "#FF0000",
    });
  },
});

Devvit.addTrigger({
  event: "AppUpgrade",
  async onEvent(event, context) {
    console.log(`App updated on r/${event.subreddit?.name}.`);

    const subreddit = await context.reddit.getCurrentSubreddit();
    const appAccount = await context.reddit.getAppUser();

    var firstMsg = `Hello r/${subreddit.name} mods,\n\n`;

    ((firstMsg += `Thanks for **updating Relay App**!\n\n`),
      (firstMsg += `This tool helps your team publish and manage official mod posts and mod comments — fast, consistent, and without shared accounts.\n\n`));

    /* WHAT'S NEW */
    ((firstMsg += `**What’s new (highlights):**\n\n\n`),
      (firstMsg += `- Schedule up to **5** post templates to automatically publish at specific times weekly (with optional **Sticky** and **Lock**).\n`),
      (firstMsg += `- **Lock Relay App posts/comments** — Functionality has been implemented to allow locking of Relay App posts/comments.\n\n`),
      (firstMsg += `- **Post Templates** — you can save up to **5** reusable templates per subreddit. Add them in the app settings and then use **Use template** when creating a post.\n\n`),
      (firstMsg += `- **Auto-flair after posting** — automatically apply a flair (e.g., *Mod Post*) to every post published via Relay App.\n\n`),
      (firstMsg += `- **Auto-flair after commenting** — when a **mod replies via Relay App**, the post flair can automatically switch (e.g., *Mods Replied*).\n\n`),
      (firstMsg += `- **Clone Post** — click **Clone** on any previous post to create a new one. Super fast for monthly stickies and AMA re-runs.\n\n`));

    /* REMINDERS */
    ((firstMsg += `**Good to know / reminders:**\n\n\n`),
      (firstMsg += `- Titles **cannot be edited** after publishing (Reddit limitation). Double-check before posting.\n\n`),
      (firstMsg += `- An **internal mod note** is automatically added after each publish, showing who posted and linking to the content.\n\n`),
      (firstMsg += `- **Modmail notifications are ON by default** on submit and on edit — great for long announcements so your team always has a copy.\n\n`),
      (firstMsg += `- **Discord notifications** are supported (add your webhook in settings). Note: very long bodies may hit Discord’s payload limits.\n\n`),
      (firstMsg += `- You can **permanently delete** posts/comments created by the app (not just remove) — use with care.\n\n`),
      (firstMsg += `- To use the app, you need **Post** or **Everything** permissions.\n\n`));

    /* CONFIG LINKS */
    ((firstMsg += `**Configure now:** manage templates, auto-flair, and Discord here → [Relay App settings](https://developers.reddit.com/r/${subreddit.name}/apps/relay-app)\n\n\n`),
      /* COMING SOON */
      (firstMsg += `**Coming soon:** monthly scheduled posting!\n\n`));

    /* FOOTER */
    ((firstMsg += `[Terms & Conditions](https://www.reddit.com/r/RelayLabs/wiki/terms-and-conditions/) | `),
      (firstMsg += `[Privacy Policy](https://www.reddit.com/r/RelayLabs/wiki/privacy-policy/) | `),
      (firstMsg += `[Contact](https://reddit.com/r/RelayLabs)\n\n`));

    await context.reddit.sendPrivateMessageAsSubreddit({
      fromSubredditName: subreddit.name,
      to: "relay-app",
      subject: `Relay App: update`,
      text: firstMsg,
    });
    console.log(`Message sent to r/${event.subreddit?.name} mods.`);
    await context.reddit.setUserFlair({
      subredditName: subreddit.name,
      username: appAccount.username,
      text: "Mod Bot 🤖",
      textColor: "light",
      backgroundColor: "#FF0000",
    });
  },
});

const submitForm = Devvit.createForm(
  {
    title: "Submit a post",
    fields: [
      {
        name: `titleOB`,
        label: "Post title",
        type: "string",
        required: true,
      },
      {
        name: `bodyP`,
        label: "Body",
        type: "paragraph",
        required: true,
      },
      {
        name: `mybDist`,
        label: `Distinguish?`,
        type: "boolean",
        defaultValue: true,
        helpText:
          "All content created by the app is distinguished, so users clearly see they come from the mod team.",
        disabled: true,
      },
      {
        name: `iSticky`,
        label: `Sticky?`,
        type: "boolean",
      },
      {
        name: `iLock`,
        label: `Lock?`,
        type: "boolean",
      },
    ],
    acceptLabel: "Post",
    description:
      "This is a form for submitting a post through mod Relay App. You can edit the post later.",
    cancelLabel: "Cancel",
  },
  async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const appAccount = await reddit.getAppUser();
    const currentUser = await reddit.getCurrentUser();

    const distinguishPost = _event.values.mybDist;
    const stickyPost = _event.values.iSticky;
    const lockPost = _event.values.iLock;

    const setRelayAppPostFlair = (await context?.settings.get(
      "setFlairAfterPosting",
    )) as boolean;
    const relayAppFlairText = (await context?.settings.get(
      "relayAppPostFlairText",
    )) as string;

    const postTitle = _event.values.titleOB;
    var postBody = _event.values.bodyP;

    if (!postTitle) {
      console.log(`Post doesn't have title, returning...`);
      return ui.showToast("Sorry, no title.");
    } else {
      const newPost = await context.reddit.submitPost({
        subredditName: subreddit.name,
        title: postTitle,
        text: postBody,
      });

      if (distinguishPost == true) {
        newPost.distinguish();
        console.log(`Post ${newPost.id} distinguished!`);
      }
      if (stickyPost == true) {
        newPost.sticky();
        console.log(`Post ${newPost.id} stickied!`);
      }
      if (lockPost == true) {
        newPost.lock(); 
        console.log(`Post ${newPost.id} locked!`);
      }

      if (!setRelayAppPostFlair) {
        console.log("Auto changing the post flair is disabled, skipping...");
      } else {
        console.log("Auto changing the post flair is enabled, okay...");
        await context.reddit.setPostFlair({
          subredditName: subreddit.name,
          postId: newPost.id,
          text: relayAppFlairText,
        });
      }
      await context.reddit.addModNote({
        subreddit: subreddit.name,
        user: appAccount.username,
        label: "SOLID_CONTRIBUTOR",
        redditId: newPost.id,
        note: `${currentUser?.username} created a mod post (title: ${postTitle}).`,
      });
      console.log(
        `Added mod note for post ${newPost.id} by ${currentUser?.username}.`,
      );
      const sendtoModmail = (await context?.settings.get(
        "sendModmail",
      )) as boolean;
      const sendtoDiscord = (await context?.settings.get(
        "sendDiscord",
      )) as boolean;
      var logMsg = `**Title**: ${newPost.title}\n\n`;
      ((logMsg += `**URL**: https://reddit.com${newPost.permalink}\n\n`),
        (logMsg += `**Moderator**: ${currentUser?.username}\n\n`));
      logMsg += `**Post body**: ${newPost.body}\n\n`;

      ui.showToast("Posted!");
      console.log(
        `${currentUser?.username} used Relay App to post ${newPost.url}`,
      );
      if (sendtoModmail == false) {
        console.log("Not sending to Modmail, skipping...");
      } else {
        await context.reddit.sendPrivateMessageAsSubreddit({
          fromSubredditName: subreddit.name,
          to: appAccount.username,
          subject: `Mod post submitted`,
          text: logMsg,
        });
        console.log(`Sent to Modmail!`);
      }
      const webhook = (await context?.settings.get("webhookEditor")) as string;
      if (!webhook) {
        console.error("No webhook URL provided");
        return;
      } else {
        try {
          let payload;
          if (sendtoDiscord == false) {
            console.log("Not sending to Discord, skipping...");
          } else {
            const discordRole = await context.settings.get("discordRole");
            let discordAlertMessage;
            if (discordRole) {
              discordAlertMessage = `<@&${discordRole}>\n\n`;
            } else {
              discordAlertMessage = ``;
            }

            if (webhook.startsWith("https://discord.com/api/webhooks/")) {
              console.log("Got Discord webhook, let's go!");

              // Check if the webhook is a Discord webhook
              payload = {
                content: discordAlertMessage,
                embeds: [
                  {
                    title: `${newPost.title}`,
                    url: `https://reddit.com${newPost.permalink}`,
                    fields: [
                      {
                        name: "Subreddit",
                        value: `r/${subreddit.name}`,
                        inline: true,
                      },
                      {
                        name: "Moderator",
                        value: `${currentUser?.username}`,
                        inline: true,
                      },
                      {
                        name: "Post body",
                        value: `${newPost.body}`,
                        inline: true,
                      },
                    ],
                  },
                ],
              };
            }
          }
          try {
            // Send alert to Discord
            await fetch(webhook, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });
            console.log("Alert sent to Discord!");
          } catch (err) {
            console.error(`Error sending alert: ${err}`);
          }
        } catch (err) {
          console.error(`Error sending alert: ${err}`);
        }
      }
    }
  },
);

Devvit.addMenuItem({
  location: "subreddit",
  label: "[Relay App] - Submit mod post",
  description:
    "A form for submitting a post through Relay app. Post can be edited later.",
  forUserType: "moderator",
  onPress: async (_event, context) => {
    const { ui } = context;

    const subreddit = await context.reddit.getCurrentSubreddit();
    const appUser = await context.reddit.getCurrentUser();
    const botAccount = (await context.reddit.getAppUser()).username;
    const perms = await appUser?.getModPermissionsForSubreddit(subreddit.name);

    if (perms?.includes("posts") || perms?.includes("all")) {
      console.log(
        `${appUser?.username} has needed permissions (${perms}), ok!`,
      );
      context.ui.showForm(submitForm);
    } else {
      console.log(
        `${appUser?.username} doesn't have Posts permission (${perms}), not ok!`,
      );
      return ui.showToast(`You don't have the necessary permissions.`);
    }
  },
});

const editForm = Devvit.createForm(
  (data) => ({
    fields: [
      {
        name: `nTitle`,
        label: "Post title",
        type: "string",
        defaultValue: data.pTitle,
        helpText: `Post title can't be edited.`,
        disabled: true,
      },
      {
        name: `nBody`,
        label: "Post body",
        type: "paragraph",
        defaultValue: data.pBody,
        required: true,
      },
      {
        name: `reasonRevision`,
        label: "Reason",
        type: "string",
      },
      {
        name: `mybDist`,
        label: `Distinguish?`,
        type: "boolean",
        defaultValue: data.statusDist,
        helpText:
          "All content created by the app is distinguished, so users clearly see they come from the mod team.",
        disabled: true,
      },
      {
        name: `iSticky`,
        label: `Sticky?`,
        type: "boolean",
        defaultValue: data.statusSticky,
      },
      {
        name: `iLock`,
        label: `Lock?`,
        type: "boolean",
        defaultValue: data.statusLock,
      },
    ],
    title: "Edit post",
    acceptLabel: "Submit",
    cancelLabel: "Cancel",
  }),
  async (event, context) => {
    console.log(event.values);
    const subreddit = await context.reddit.getCurrentSubreddit();
    const appAccount = (await context.reddit.getAppUser()).username;
    const modEditor = (await context.reddit.getCurrentUser())?.username;
    const originalPost = context.postId!;
    const getPost = await context.reddit.getPostById(originalPost);
    const img = event.values.imgBody;
    const distinguishPost = event.values.mybDist;
    const stickyPost = event.values.iSticky;
    const lockPost = event.values.iLock;

    const sendtoModmail = (await context?.settings.get(
      "sendModmail",
    )) as boolean;
    const sendtoDiscord = (await context?.settings.get(
      "sendDiscord",
    )) as boolean;

    const oldBody = getPost.body;

    var newPostBody = event.values.nBody;

    if (distinguishPost == false) {
      console.log("Undistinguishing post...");
      getPost.undistinguish();
    } else {
      console.log("Distinguishing post...");
      getPost.distinguish();
    }

    if (stickyPost == false) {
      console.log("Unstickying post...");
      getPost.unsticky();
    } else {
      console.log("Stickying post...");
      getPost.sticky();
    }

    if (lockPost == false) {
      console.log("Unlocking post...");
      getPost.lock({ locked: false });
    } else {
      console.log("Locking post...");
      getPost.lock({ locked: true });
    }

    const reasonRev = event.values.reasonRevision;
    getPost.edit({ text: newPostBody });
    context.ui.showToast("Edited!");
    console.log(`${modEditor} used Relay App to edit the post ${getPost.url}.`);

    await context.reddit.addModNote({
      subreddit: subreddit.name,
      user: appAccount,
      label: "SOLID_CONTRIBUTOR",
      note: `${modEditor} edited mod post, reason: ${reasonRev}`,
      redditId: originalPost,
    });

    /* await context.modLog
        .add({
          action: 'edit_scheduled_post',
          target: originalPost,
          details: `Edited mod post`,
        })
        .catch((e: any) =>
          console.error(`Failed to add modlog for: ${originalPost}.`, e.message)
        ); */

    var logMsg = `Title: ${getPost.title}\n\n`;
    ((logMsg += `URL: https://reddit.com${getPost.permalink}\n\n`),
      (logMsg += `Moderator: ${modEditor}\n\n`));
    logMsg += `Previous post body: ${oldBody}\n\n`;
    logMsg += `New post body: ${newPostBody}\n\n`;
    logMsg += `Reason for revision: ${reasonRev}\n\n`;

    if (sendtoModmail == false) {
      console.log("Not sending to Modmail, skipping...");
    } else {
      await context.reddit.sendPrivateMessageAsSubreddit({
        fromSubredditName: subreddit.name,
        to: appAccount,
        subject: `Edited mod post`,
        text: logMsg,
      });
    }

    const webhook = (await context?.settings.get("webhookEditor")) as string;

    console.log(`Received ModEdit trigger event:\n${JSON.stringify(event)}`);

    if (!webhook) {
      console.error("No webhook URL provided");
      return;
    } else {
      try {
        let payload;

        if (sendtoDiscord == false) {
          console.log("Not sending to Discord, skipping...");
        } else {
          const discordRole = await context.settings.get("discordRole");

          let discordAlertMessage;
          if (discordRole) {
            discordAlertMessage = `<@&${discordRole}>\n\n`;
          } else {
            discordAlertMessage = ``;
          }

          if (webhook.startsWith("https://discord.com/api/webhooks/")) {
            console.log("Got Discord webhook, let's go!");

            // Check if the webhook is a Discord webhook
            payload = {
              content: discordAlertMessage,
              embeds: [
                {
                  title: `${getPost.title}`,
                  url: `https://reddit.com${getPost.permalink}`,
                  fields: [
                    {
                      name: "Subreddit",
                      value: `r/${subreddit.name}`,
                      inline: true,
                    },
                    {
                      name: "Moderator",
                      value: `${modEditor}`,
                      inline: true,
                    },
                    {
                      name: "Previous post body",
                      value: `${oldBody}`,
                      inline: true,
                    },
                    {
                      name: "New post body",
                      value: `${newPostBody}`,
                      inline: true,
                    },
                    {
                      name: "Reason",
                      value: `${reasonRev}`,
                      inline: true,
                    },
                    {
                      name: "Score",
                      value: `${getPost.score}`,
                      inline: true,
                    },
                  ],
                },
              ],
            };
          }
        }

        try {
          // Send alert to Discord
          await fetch(webhook, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          console.log("Alert sent to Discord!");
        } catch (err) {
          console.error(`Error sending alert: ${err}`);
        }
      } catch (err) {
        console.error(`Error sending alert: ${err}`);
      }
    }
  },
);

Devvit.addMenuItem({
  location: "post",
  label: "[Relay App] - Edit post",
  description: "A form for editing a post through Relay App.",
  forUserType: "moderator",
  onPress: async (_event, context) => {
    const { ui } = context;

    const subreddit = await context.reddit.getCurrentSubreddit();
    const originalPost = context.postId!;
    const getPost = await context.reddit.getPostById(originalPost);
    const postOP = getPost.authorName;
    const appUser = await context.reddit.getCurrentUser();

    const checkDist = getPost.isDistinguishedBy();
    const checkSt = getPost.isStickied();

    const postTitle = getPost.title;

    const botAccount = (await context.reddit.getAppUser()).username;

    const perms = await appUser?.getModPermissionsForSubreddit(subreddit.name);

    if (postOP == botAccount) {
      console.log(`${postOP} = ${botAccount}, ok!`);
      if (perms?.includes("posts") || perms?.includes("all")) {
        console.log(
          `${appUser?.username} has needed permissions (${perms}), ok!`,
        );
        context.ui.showForm(editForm, {
          pTitle: getPost.title,
          pBody: getPost.body,
          statusDist: checkDist,
          statusSticky: checkSt,
        });
      } else {
        console.log(
          `${appUser?.username} doesn't have Posts permission (${perms}), not ok!`,
        );
        return ui.showToast(`You don't have the necessary permissions.`);
      }
    } else {
      console.log(`${postOP} != ${botAccount}, not ok!`);
      return ui.showToast(`Sorry, this is not submission from ${botAccount}!`);
    }
  },
});

const submitCommentReply = Devvit.createForm(
  {
    title: "Submit a comment",
    fields: [
      {
        name: `bodyC`,
        label: "Text",
        type: "paragraph",
        required: true,
      },
      {
        name: `mybDist`,
        label: `Distinguish?`,
        type: "boolean",
        defaultValue: true,
        helpText:
          "All content created by the app is distinguished, so users clearly see they come from the mod team.",
        disabled: true,
      },
      {
        name: `iSticky`,
        label: `Sticky?`,
        type: "boolean",
      },
      {
        name: `iLock`,
        label: `Lock?`,
        type: "boolean",
      },
    ],
    acceptLabel: "Publish",
    description:
      "This is a form for submitting a reply to comment through mod Relay App. You can edit the comment later.",
    cancelLabel: "Cancel",
  },
  async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const appAccount = await reddit.getAppUser();
    const currentUser = await reddit.getCurrentUser();

    var commentBody = _event.values.bodyC;

    const originalPost = context.postId!;
    const previousComment = context.commentId!;

    const setRelayAppPostFlair = (await context?.settings.get(
      "setFlairAfterCommenting",
    )) as boolean;
    const relayAppFlairText = (await context?.settings.get(
      "relayAppCommentPostFlairText",
    )) as string;

    const newComment = await context.reddit.submitComment({
      id: originalPost,
      text: `${commentBody}`,
    });

    const distinguishComment = _event.values.mybDist;
    const stickyComment = _event.values.iSticky;
    const lockComment = _event.values.iLock;
    if (distinguishComment == true) {
      newComment.distinguish();
      console.log(`Comment ${newComment.id} distinguished!`);
    }
    if (stickyComment == true) {
      newComment.distinguish(true);
      console.log(`Comment ${newComment.id} stickied!`);
    }
    if (lockComment == true) {
      newComment.lock(); 
      console.log(`Comment ${newComment.id} locked!`);
    }
    await context.reddit.addModNote({
      subreddit: subreddit.name,
      user: appAccount.username,
      label: "SOLID_CONTRIBUTOR",
      redditId: newComment.id,
      note: `${currentUser?.username} created a mod comment.`,
    });
    console.log(
      `Added mod note for comment ${newComment.id} by ${currentUser?.username}.`,
    );

    if (!setRelayAppPostFlair) {
      console.log("Auto changing the post flair is disabled, skipping...");
    } else {
      console.log("Auto changing the post flair is enabled, okay...");
      await context.reddit.setPostFlair({
        subredditName: subreddit.name,
        postId: newComment.postId,
        text: relayAppFlairText,
      });
    }
    ui.showToast("Posted!");
    console.log(
      `${currentUser?.username} used Relay App to post a comment ${newComment.url}`,
    );
  },
);

Devvit.addMenuItem({
  location: ["post", "comment"],
  label: "[Relay App] - Comment",
  description:
    "A form for submitting a comment through Relay App. Comments can be edited later.",
  forUserType: "moderator",
  onPress: async (event, context) => {
    const { ui } = context;
    const { location } = event;

    const subreddit = await context.reddit.getCurrentSubreddit();
    const appUser = await context.reddit.getCurrentUser();
    const botAccount = (await context.reddit.getAppUser()).username;
    const perms = await appUser?.getModPermissionsForSubreddit(subreddit.name);

    if (location === "post") {
      if (perms?.includes("posts") || perms?.includes("all")) {
        console.log(
          `${appUser?.username} has needed permissions (${perms}), ok!`,
        );
        context.ui.showForm(submitCommentReply);
      } else {
        console.log(
          `${appUser?.username} doesn't have Posts permission (${perms}), not ok!`,
        );
        return ui.showToast(`You don't have the necessary permissions.`);
      }
    }

    if (location === "comment") {
      if (perms?.includes("posts") || perms?.includes("all")) {
        console.log(
          `${appUser?.username} has needed permissions (${perms}), ok!`,
        );
        context.ui.showForm(submitCommentReply);
      } else {
        console.log(
          `${appUser?.username} doesn't have Posts permission (${perms}), not ok!`,
        );
        return ui.showToast(`You don't have the necessary permissions.`);
      }
    }
  },
});

Devvit.addMenuItem({
  location: "comment",
  label: "[Relay App] - Edit comment",
  description: "A form for editing a comment through Relay App.",
  forUserType: "moderator",
  onPress: async (_event, context) => {
    const { ui } = context;

    const subreddit = await context.reddit.getCurrentSubreddit();
    const originalComment = context.commentId!;
    const getComment = await context.reddit.getCommentById(originalComment);
    const commentAuthor = getComment.authorName;
    const appUser = await context.reddit.getCurrentUser();

    const checkDist = getComment.isDistinguished();
    const checkSt = getComment.isStickied();

    const botAccount = (await context.reddit.getAppUser()).username;

    const perms = await appUser?.getModPermissionsForSubreddit(subreddit.name);

    if (commentAuthor == botAccount) {
      console.log(`${commentAuthor} = ${botAccount}, ok!`);
      if (perms?.includes("posts") || perms?.includes("all")) {
        console.log(
          `${appUser?.username} has needed permissions (${perms}), ok!`,
        );
        context.ui.showForm(editComment, {
          cBody: getComment.body,
          statusDist: checkDist,
          statusSticky: checkSt,
        });
      } else {
        console.log(
          `${appUser?.username} doesn't have Posts permission (${perms}), not ok!`,
        );
        return ui.showToast(`You don't have the necessary permissions.`);
      }
    } else {
      console.log(`${commentAuthor} != ${botAccount}, not ok!`);
      return ui.showToast(`Sorry, this is not submission from ${botAccount}!`);
    }
  },
});

const editComment = Devvit.createForm(
  (data) => ({
    fields: [
      {
        name: `nBody`,
        label: "Comment",
        type: "paragraph",
        defaultValue: data.cBody,
        required: true,
      },
      {
        name: `reasonRevision`,
        label: "Reason",
        type: "string",
      },
      {
        name: `mybDist`,
        label: `Distinguish?`,
        type: "boolean",
        defaultValue: data.statusDist,
        helpText:
          "All content created by the app is distinguished, so users clearly see they come from the mod team.",
        disabled: true,
      },
      {
        name: `iSticky`,
        label: `Sticky?`,
        type: "boolean",
        defaultValue: data.statusSticky,
      },
      {
        name: `iLock`,
        label: `Lock?`,
        type: "boolean",
        defaultValue: data.statusLock,
      },
    ],
    title: "Edit comment",
    acceptLabel: "Submit",
    cancelLabel: "Cancel",
  }),
  async (event, context) => {
    console.log(event.values);
    const subreddit = await context.reddit.getCurrentSubreddit();
    const appAccount = (await context.reddit.getAppUser()).username;
    const modEditor = (await context.reddit.getCurrentUser())?.username;
    const originalComment = context.commentId!;
    const getComment = await context.reddit.getCommentById(originalComment);
    const img = event.values.imgBody;
    const distinguishComment = event.values.mybDist;
    const stickyComment = event.values.iSticky;
    const lockComment = event.values.iLock;

    const sendtoModmail = (await context?.settings.get(
      "sendModmail",
    )) as boolean;

    const oldBody = getComment.body;

    var newCommentText = event.values.nBody;

    if (distinguishComment == false) {
      console.log("Undistinguishing comment...");
      getComment.undistinguish();
    } else {
      console.log("Distinguishing comment...");
      getComment.distinguish();
    }

    if (stickyComment == false) {
      console.log("Unstickying comment...");
      getComment.distinguish(false);
    } else {
      console.log("Stickying comment...");
      getComment.distinguish(true);
    }

    if (lockComment == false) {
      console.log("Unlocking comment...");
      getComment.lock(false);
    } else {
      console.log("Locking comment...");
      getComment.lock(true);
    }

    const reasonRev = event.values.reasonRevision;
    getComment.edit({ text: newCommentText });
    context.ui.showToast("Edited!");
    console.log(`${modEditor} used Relay App to post ${getComment.url}`);

    await context.reddit.addModNote({
      subreddit: subreddit.name,
      user: appAccount,
      label: "SOLID_CONTRIBUTOR",
      note: `${modEditor} edited mod comment, reason: ${reasonRev}`,
      redditId: originalComment,
    });

    /* await context.modLog
          .add({
            action: 'edit_scheduled_post',
            target: originalPost,
            details: `Edited mod post`,
          })
          .catch((e: any) =>
            console.error(`Failed to add modlog for: ${originalPost}.`, e.message)
          ); */

    var logMsg = `Comment URL: https://reddit.com${getComment.permalink}\n\n`;
    logMsg += `Moderator: ${modEditor}\n\n`;
    logMsg += `Previous version: ${oldBody}\n\n`;
    logMsg += `New version: ${newCommentText}\n\n`;
    logMsg += `Reason for revision: ${reasonRev}\n\n`;

    if (sendtoModmail == false) {
      console.log("Not sending to Modmail, skipping...");
    } else {
      await context.reddit.sendPrivateMessageAsSubreddit({
        fromSubredditName: subreddit.name,
        to: appAccount,
        subject: `Edited mod comment`,
        text: logMsg,
      });
    }
  },
);

Devvit.addMenuItem({
  location: ["post"],
  forUserType: "moderator",
  label: "[Relay App] - Delete content",
  description: "Option to delete post by Relay App",
  onPress: async (event, context) => {
    const { reddit, ui } = context;
    const { location } = event;
    const subreddit = await context.reddit.getCurrentSubreddit();
    const postId = context.postId!;
    const appUser = context.reddit.getAppUser();
    const currentUser = await context.reddit.getCurrentUser();
    const perms = await currentUser?.getModPermissionsForSubreddit(
      subreddit.name,
    );
    const appPost = await context.reddit.getPostById(postId);

    if (
      (location === "post" && perms?.includes("posts")) ||
      perms?.includes("all")
    ) {
      if (
        (await context.reddit.getPostById(context.postId!)).authorName ==
        (await appUser).username
      ) {
        appPost.delete();
        console.log(`Relay App content deleted by ${currentUser?.username}.`);
        return ui.showToast("Deleted!");
      } else {
        ui.showToast(
          `This is only for content removal by ${(await appUser).username}!`,
        );
      }
    } else {
      ui.showToast(`You don't have the necessary permissions.`);
    }
  },
});

Devvit.addMenuItem({
  location: ["comment"],
  forUserType: "moderator",
  label: "[Relay App] - Delete content",
  description: "Option to delete comment by Relay App",
  onPress: async (event, context) => {
    const { reddit, ui } = context;
    const { location } = event;
    const subreddit = await context.reddit.getCurrentSubreddit();
    const commentId = context.commentId!;
    const appUser = context.reddit.getAppUser();
    const currentUser = await context.reddit.getCurrentUser();
    const perms = await currentUser?.getModPermissionsForSubreddit(
      subreddit.name,
    );
    const appComment = await context.reddit.getCommentById(commentId);

    if (
      (location === "comment" && perms?.includes("posts")) ||
      perms?.includes("all")
    ) {
      if (
        (await context.reddit.getCommentById(context.commentId!)).authorName ==
        (await appUser).username
      ) {
        appComment.delete();
        console.log(`Relay App comment deleted by ${currentUser?.username}.`);
        return ui.showToast("Deleted!");
      } else {
        ui.showToast(
          `This is only for content removal by ${(await appUser).username}!`,
        );
      }
    } else {
      ui.showToast(`You don't have the necessary permissions.`);
    }
  },
});

Devvit.addMenuItem({
  location: "subreddit",
  label: "[Relay App] - Use template",
  description: "Submit a mod post using templates.",
  forUserType: "moderator",
  onPress: async (_event, context) => {
    const { ui } = context;

    const subreddit = await context.reddit.getCurrentSubreddit();
    const appUser = await context.reddit.getCurrentUser();

    const template1name = (await context?.settings.get(
      "postTemplate1name",
    )) as string;
    const template1title = (await context?.settings.get(
      "postTemplate1title",
    )) as string;
    const template1body = (await context?.settings.get(
      "postTemplate1body",
    )) as Paragraph;

    const template2name = (await context?.settings.get(
      "postTemplate2name",
    )) as string;
    const template2title = (await context?.settings.get(
      "postTemplate2title",
    )) as string;
    const template2body = (await context?.settings.get(
      "postTemplate2body",
    )) as Paragraph;

    const template3name = (await context?.settings.get(
      "postTemplate3name",
    )) as string;
    const template3title = (await context?.settings.get(
      "postTemplate3title",
    )) as string;
    const template3body = (await context?.settings.get(
      "postTemplate3body",
    )) as Paragraph;

    const template4name = (await context?.settings.get(
      "postTemplate3name",
    )) as string;
    const template4title = (await context?.settings.get(
      "postTemplate3title",
    )) as string;
    const template4body = (await context?.settings.get(
      "postTemplate3body",
    )) as Paragraph;

    const template5name = (await context?.settings.get(
      "postTemplate3name",
    )) as string;
    const template5title = (await context?.settings.get(
      "postTemplate3title",
    )) as string;
    const template5body = (await context?.settings.get(
      "postTemplate3body",
    )) as Paragraph;

    const botAccount = (await context.reddit.getAppUser()).username;

    const perms = await appUser?.getModPermissionsForSubreddit(subreddit.name);

    if (perms?.includes("posts") || perms?.includes("all")) {
      console.log(
        `${appUser?.username} has needed permissions (${perms}), ok!`,
      );
      context.ui.showForm(useTemplate, {
        tempName1: template1name,
        tempTitle1: template1title,
        tempBody1: template1body,
        tempName2: template2name,
        tempTitle2: template2title,
        tempBody2: template2body,
        tempName3: template3name,
        tempTitle3: template3title,
        tempBody3: template3body,
        tempName4: template4name,
        tempTitle4: template4title,
        tempBody4: template4body,
        tempName5: template5name,
        tempTitle5: template5title,
        tempBody5: template5body,
      });
    } else {
      console.log(
        `${appUser?.username} doesn't have Posts permission (${perms}), not ok!`,
      );
      return ui.showToast(`You don't have the necessary permissions.`);
    }
  },
});

const useTemplate = Devvit.createForm(
  (data) => ({
    fields: [
      {
        name: `templateNumber`,
        label: "Select template",
        type: "select",
        options: [
          { label: data.tempName1, value: "template1" },
          { label: data.tempName2, value: "template2" },
          { label: data.tempName3, value: "template3" },
          { label: data.tempName4, value: "template4" },
          { label: data.tempName5, value: "template5" },
        ],
      },
    ],
    title: "Use template",
    acceptLabel: "Select",
    cancelLabel: "Cancel",
  }),
  async (_event, context) => {
    console.log(_event.values);
    const subreddit = await context.reddit.getCurrentSubreddit();
    const appAccount = (await context.reddit.getAppUser()).username;

    const template1name = (await context?.settings.get(
      "postTemplate1name",
    )) as string;
    const template1title = (await context?.settings.get(
      "postTemplate1title",
    )) as string;
    const template1body = (await context?.settings.get(
      "postTemplate1body",
    )) as Paragraph;

    const template2name = (await context?.settings.get(
      "postTemplate2name",
    )) as string;
    const template2title = (await context?.settings.get(
      "postTemplate2title",
    )) as string;
    const template2body = (await context?.settings.get(
      "postTemplate2body",
    )) as Paragraph;

    const template3name = (await context?.settings.get(
      "postTemplate3name",
    )) as string;
    const template3title = (await context?.settings.get(
      "postTemplate3title",
    )) as string;
    const template3body = (await context?.settings.get(
      "postTemplate3body",
    )) as Paragraph;

    const template4name = (await context?.settings.get(
      "postTemplate4name",
    )) as string;
    const template4title = (await context?.settings.get(
      "postTemplate4title",
    )) as string;
    const template4body = (await context?.settings.get(
      "postTemplate4body",
    )) as Paragraph;

    const template5name = (await context?.settings.get(
      "postTemplate5name",
    )) as string;
    const template5title = (await context?.settings.get(
      "postTemplate5title",
    )) as string;
    const template5body = (await context?.settings.get(
      "postTemplate5body",
    )) as Paragraph;

    if (_event.values.templateNumber == "template1") {
      context.ui.showForm(useTemplateOne, {
        tempName1: template1name,
        tempTitle1: template1title,
        tempBody1: template1body,
      });
    } else if (_event.values.templateNumber == "template2") {
      context.ui.showForm(useTemplateTwo, {
        tempName2: template2name,
        tempTitle2: template2title,
        tempBody2: template2body,
      });
    } else if (_event.values.templateNumber == "template3") {
      context.ui.showForm(useTemplateThree, {
        tempName3: template3name,
        tempTitle3: template3title,
        tempBody3: template3body,
      });
      } else if (_event.values.templateNumber == "template4") {
      context.ui.showForm(useTemplateFour, {
        tempName4: template4name,
        tempTitle4: template4title,
        tempBody4: template4body,
      });
      } else if (_event.values.templateNumber == "template5") {
      context.ui.showForm(useTemplateFive, {
        tempName5: template5name,
        tempTitle5: template5title,
        tempBody5: template5body,
      });
    } else {
      context.ui.showToast("You must select a template.");
    }
  },
);

const useTemplateOne = Devvit.createForm(
  (data) => ({
    fields: [
      {
        name: `templateNumberOneTitle`,
        label: "Post title",
        type: "string",
        defaultValue: data.tempTitle1,
      },
      {
        name: `templateNumberOneBody`,
        label: "Post body",
        type: "paragraph",
        defaultValue: data.tempBody1,
      },
      {
        name: `mybDist`,
        label: `Distinguish?`,
        type: "boolean",
        defaultValue: true,
        helpText:
          "All content created by the app is distinguished, so users clearly see they come from the mod team.",
        disabled: true,
      },
      {
        name: `iSticky`,
        label: `Sticky?`,
        type: "boolean",
      },
      {
        name: `iLock`,
        label: `Lock?`,
        type: "boolean",
      },
    ],
    title: data.tempName1,
    acceptLabel: "Submit",
    cancelLabel: "Cancel",
  }),
  async (_event, context) => {
    const { reddit, ui } = context;
    console.log(_event.values);
    const subreddit = await context.reddit.getCurrentSubreddit();
    const appAccount = (await context.reddit.getAppUser()).username;

    const postTitle = _event.values.templateNumberOneTitle;
    var postBody = _event.values.templateNumberOneBody;
    const currentUser = await reddit.getCurrentUser();

    const distinguishPost = _event.values.mybDist;
    const stickyPost = _event.values.iSticky;
    const lockPost = _event.values.iLock;

    const setRelayAppPostFlair = (await context?.settings.get(
      "setFlairAfterPosting",
    )) as boolean;
    const relayAppFlairText = (await context?.settings.get(
      "relayAppPostFlairText",
    )) as string;

    if (!postTitle) {
      console.log(`Post doesn't have title, returning...`);
      return ui.showToast("Sorry, no title.");
    } else {
      const newPost = await context.reddit.submitPost({
        subredditName: subreddit.name,
        title: postTitle,
        text: postBody,
      });

      if (distinguishPost == true) {
        newPost.distinguish();
        console.log(`Post ${newPost.id} distinguished!`);
      }
      if (stickyPost == true) {
        newPost.sticky();
        console.log(`Post ${newPost.id} stickied!`);
      }
      if (lockPost == true) {
        newPost.lock();
        console.log(`Post ${newPost.id} locked!`);
      }

      if (!setRelayAppPostFlair) {
        console.log("Auto changing the post flair is disabled, skipping...");
      } else {
        console.log("Auto changing the post flair is enabled, okay...");
        await context.reddit.setPostFlair({
          subredditName: subreddit.name,
          postId: newPost.id,
          text: relayAppFlairText,
        });
      }
      await context.reddit.addModNote({
        subreddit: subreddit.name,
        user: appAccount,
        label: "SOLID_CONTRIBUTOR",
        redditId: newPost.id,
        note: `${currentUser?.username} created a mod post (title: ${postTitle}).`,
      });
      console.log(
        `Added mod note for post ${newPost.id} by ${currentUser?.username}.`,
      );
      const sendtoModmail = (await context?.settings.get(
        "sendModmail",
      )) as boolean;
      const sendtoDiscord = (await context?.settings.get(
        "sendDiscord",
      )) as boolean;
      var logMsg = `**Title**: ${newPost.title}\n\n`;
      ((logMsg += `**URL**: https://reddit.com${newPost.permalink}\n\n`),
        (logMsg += `**Moderator**: ${currentUser?.username}\n\n`));
      logMsg += `**Post body**: ${newPost.body}\n\n`;

      ui.showToast("Posted!");
      console.log(
        `${currentUser?.username} used Relay App to post ${newPost.url}`,
      );
      if (sendtoModmail == false) {
        console.log("Not sending to Modmail, skipping...");
      } else {
        await context.reddit.sendPrivateMessageAsSubreddit({
          fromSubredditName: subreddit.name,
          to: appAccount,
          subject: `Mod post submitted`,
          text: logMsg,
        });
        console.log(`Sent to Modmail!`);
      }
      const webhook = (await context?.settings.get("webhookEditor")) as string;
      if (!webhook) {
        console.error("No webhook URL provided");
        return;
      } else {
        try {
          let payload;
          if (sendtoDiscord == false) {
            console.log("Not sending to Discord, skipping...");
          } else {
            const discordRole = await context.settings.get("discordRole");
            let discordAlertMessage;
            if (discordRole) {
              discordAlertMessage = `<@&${discordRole}>\n\n`;
            } else {
              discordAlertMessage = ``;
            }

            if (webhook.startsWith("https://discord.com/api/webhooks/")) {
              console.log("Got Discord webhook, let's go!");

              // Check if the webhook is a Discord webhook
              payload = {
                content: discordAlertMessage,
                embeds: [
                  {
                    title: `${newPost.title}`,
                    url: `https://reddit.com${newPost.permalink}`,
                    fields: [
                      {
                        name: "Subreddit",
                        value: `r/${subreddit.name}`,
                        inline: true,
                      },
                      {
                        name: "Moderator",
                        value: `${currentUser?.username}`,
                        inline: true,
                      },
                      {
                        name: "Post body",
                        value: `${newPost.body}`,
                        inline: true,
                      },
                    ],
                  },
                ],
              };
            }
          }
          try {
            // Send alert to Discord
            await fetch(webhook, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });
            console.log("Alert sent to Discord!");
          } catch (err) {
            console.error(`Error sending alert: ${err}`);
          }
        } catch (err) {
          console.error(`Error sending alert: ${err}`);
        }
      }
    }
  },
);

const useTemplateTwo = Devvit.createForm(
  (data) => ({
    fields: [
      {
        name: `templateNumberTwoTitle`,
        label: "Post title",
        type: "string",
        defaultValue: data.tempTitle2,
      },
      {
        name: `templateNumberTwoBody`,
        label: "Post body",
        type: "paragraph",
        defaultValue: data.tempBody2,
      },
      {
        name: `mybDist`,
        label: `Distinguish?`,
        type: "boolean",
        defaultValue: true,
        helpText:
          "All content created by the app is distinguished, so users clearly see they come from the mod team.",
        disabled: true,
      },
      {
        name: `iSticky`,
        label: `Sticky?`,
        type: "boolean",
      },
      {
        name: `iLock`,
        label: `Lock?`,
        type: "boolean",
      },
    ],
    title: data.tempName2,
    acceptLabel: "Submit",
    cancelLabel: "Cancel",
  }),
  async (_event, context) => {
    const { reddit, ui } = context;
    console.log(_event.values);
    const subreddit = await context.reddit.getCurrentSubreddit();
    const appAccount = (await context.reddit.getAppUser()).username;

    const postTitle = _event.values.templateNumberTwoTitle;
    var postBody = _event.values.templateNumberTwoBody;
    const currentUser = await reddit.getCurrentUser();

    const distinguishPost = _event.values.mybDist;
    const stickyPost = _event.values.iSticky;
    const lockPost = _event.values.iLock;

    const setRelayAppPostFlair = (await context?.settings.get(
      "setFlairAfterPosting",
    )) as boolean;
    const relayAppFlairText = (await context?.settings.get(
      "relayAppPostFlairText",
    )) as string;

    if (!postTitle) {
      console.log(`Post doesn't have title, returning...`);
      return ui.showToast("Sorry, no title.");
    } else {
      const newPost = await context.reddit.submitPost({
        subredditName: subreddit.name,
        title: postTitle,
        text: postBody,
      });

      if (distinguishPost == true) {
        newPost.distinguish();
        console.log(`Post ${newPost.id} distinguished!`);
      }
      if (stickyPost == true) {
        newPost.sticky();
        console.log(`Post ${newPost.id} stickied!`);
      }
      if (lockPost == true) {
        newPost.lock();
        console.log(`Post ${newPost.id} locked!`);
      }

      if (!setRelayAppPostFlair) {
        console.log("Auto changing the post flair is disabled, skipping...");
      } else {
        console.log("Auto changing the post flair is enabled, okay...");
        await context.reddit.setPostFlair({
          subredditName: subreddit.name,
          postId: newPost.id,
          text: relayAppFlairText,
        });
      }
      await context.reddit.addModNote({
        subreddit: subreddit.name,
        user: appAccount,
        label: "SOLID_CONTRIBUTOR",
        redditId: newPost.id,
        note: `${currentUser?.username} created a mod post (title: ${postTitle}).`,
      });
      console.log(
        `Added mod note for post ${newPost.id} by ${currentUser?.username}.`,
      );
      const sendtoModmail = (await context?.settings.get(
        "sendModmail",
      )) as boolean;
      const sendtoDiscord = (await context?.settings.get(
        "sendDiscord",
      )) as boolean;
      var logMsg = `**Title**: ${newPost.title}\n\n`;
      ((logMsg += `**URL**: https://reddit.com${newPost.permalink}\n\n`),
        (logMsg += `**Moderator**: ${currentUser?.username}\n\n`));
      logMsg += `**Post body**: ${newPost.body}\n\n`;

      ui.showToast("Posted!");
      console.log(
        `${currentUser?.username} used Relay App to post ${newPost.url}`,
      );
      if (sendtoModmail == false) {
        console.log("Not sending to Modmail, skipping...");
      } else {
        await context.reddit.sendPrivateMessageAsSubreddit({
          fromSubredditName: subreddit.name,
          to: appAccount,
          subject: `Mod post submitted`,
          text: logMsg,
        });
        console.log(`Sent to Modmail!`);
      }
      const webhook = (await context?.settings.get("webhookEditor")) as string;
      if (!webhook) {
        console.error("No webhook URL provided");
        return;
      } else {
        try {
          let payload;
          if (sendtoDiscord == false) {
            console.log("Not sending to Discord, skipping...");
          } else {
            const discordRole = await context.settings.get("discordRole");
            let discordAlertMessage;
            if (discordRole) {
              discordAlertMessage = `<@&${discordRole}>\n\n`;
            } else {
              discordAlertMessage = ``;
            }

            if (webhook.startsWith("https://discord.com/api/webhooks/")) {
              console.log("Got Discord webhook, let's go!");

              // Check if the webhook is a Discord webhook
              payload = {
                content: discordAlertMessage,
                embeds: [
                  {
                    title: `${newPost.title}`,
                    url: `https://reddit.com${newPost.permalink}`,
                    fields: [
                      {
                        name: "Subreddit",
                        value: `r/${subreddit.name}`,
                        inline: true,
                      },
                      {
                        name: "Moderator",
                        value: `${currentUser?.username}`,
                        inline: true,
                      },
                      {
                        name: "Post body",
                        value: `${newPost.body}`,
                        inline: true,
                      },
                    ],
                  },
                ],
              };
            }
          }
          try {
            // Send alert to Discord
            await fetch(webhook, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });
            console.log("Alert sent to Discord!");
          } catch (err) {
            console.error(`Error sending alert: ${err}`);
          }
        } catch (err) {
          console.error(`Error sending alert: ${err}`);
        }
      }
    }
  },
);

const useTemplateThree = Devvit.createForm(
  (data) => ({
    fields: [
      {
        name: `templateNumberThreeTitle`,
        label: "Post title",
        type: "string",
        defaultValue: data.tempTitle3,
      },
      {
        name: `templateNumberThreeBody`,
        label: "Post body",
        type: "paragraph",
        defaultValue: data.tempBody3,
      },
      {
        name: `mybDist`,
        label: `Distinguish?`,
        type: "boolean",
        helpText:
          "All content created by the app is distinguished, so users clearly see they come from the mod team.",
        defaultValue: true,
        disabled: true,
      },
      {
        name: `iSticky`,
        label: `Sticky?`,
        type: "boolean",
      },
      {
        name: `iLock`,
        label: `Lock?`,
        type: "boolean",
      },
    ],
    title: data.tempName3,
    acceptLabel: "Submit",
    cancelLabel: "Cancel",
  }),
  async (_event, context) => {
    const { reddit, ui } = context;
    console.log(_event.values);
    const subreddit = await context.reddit.getCurrentSubreddit();
    const appAccount = (await context.reddit.getAppUser()).username;

    const postTitle = _event.values.templateNumberThreeTitle;
    var postBody = _event.values.templateNumberThreeBody;
    const currentUser = await reddit.getCurrentUser();

    const distinguishPost = _event.values.mybDist;
    const stickyPost = _event.values.iSticky;
    const lockPost = _event.values.iLock;

    const setRelayAppPostFlair = (await context?.settings.get(
      "setFlairAfterPosting",
    )) as boolean;
    const relayAppFlairText = (await context?.settings.get(
      "relayAppPostFlairText",
    )) as string;

    if (!postTitle) {
      console.log(`Post doesn't have title, returning...`);
      return ui.showToast("Sorry, no title.");
    } else {
      const newPost = await context.reddit.submitPost({
        subredditName: subreddit.name,
        title: postTitle,
        text: postBody,
      });

      if (distinguishPost == true) {
        newPost.distinguish();
        console.log(`Post ${newPost.id} distinguished!`);
      }
      if (stickyPost == true) {
        newPost.sticky();
        console.log(`Post ${newPost.id} stickied!`);
      }
      if (lockPost == true) {
        newPost.lock();
        console.log(`Post ${newPost.id} locked!`);
      }

      if (!setRelayAppPostFlair) {
        console.log("Auto changing the post flair is disabled, skipping...");
      } else {
        console.log("Auto changing the post flair is enabled, okay...");
        await context.reddit.setPostFlair({
          subredditName: subreddit.name,
          postId: newPost.id,
          text: relayAppFlairText,
        });
      }
      await context.reddit.addModNote({
        subreddit: subreddit.name,
        user: appAccount,
        label: "SOLID_CONTRIBUTOR",
        redditId: newPost.id,
        note: `${currentUser?.username} created a mod post (title: ${postTitle}).`,
      });
      console.log(
        `Added mod note for post ${newPost.id} by ${currentUser?.username}.`,
      );
      const sendtoModmail = (await context?.settings.get(
        "sendModmail",
      )) as boolean;
      const sendtoDiscord = (await context?.settings.get(
        "sendDiscord",
      )) as boolean;
      var logMsg = `**Title**: ${newPost.title}\n\n`;
      ((logMsg += `**URL**: https://reddit.com${newPost.permalink}\n\n`),
        (logMsg += `**Moderator**: ${currentUser?.username}\n\n`));
      logMsg += `**Post body**: ${newPost.body}\n\n`;

      ui.showToast("Posted!");
      console.log(
        `${currentUser?.username} used Relay App to post ${newPost.url}`,
      );
      if (sendtoModmail == false) {
        console.log("Not sending to Modmail, skipping...");
      } else {
        await context.reddit.sendPrivateMessageAsSubreddit({
          fromSubredditName: subreddit.name,
          to: appAccount,
          subject: `Mod post submitted`,
          text: logMsg,
        });
        console.log(`Sent to Modmail!`);
      }
      const webhook = (await context?.settings.get("webhookEditor")) as string;
      if (!webhook) {
        console.error("No webhook URL provided");
        return;
      } else {
        try {
          let payload;
          if (sendtoDiscord == false) {
            console.log("Not sending to Discord, skipping...");
          } else {
            const discordRole = await context.settings.get("discordRole");
            let discordAlertMessage;
            if (discordRole) {
              discordAlertMessage = `<@&${discordRole}>\n\n`;
            } else {
              discordAlertMessage = ``;
            }

            if (webhook.startsWith("https://discord.com/api/webhooks/")) {
              console.log("Got Discord webhook, let's go!");

              // Check if the webhook is a Discord webhook
              payload = {
                content: discordAlertMessage,
                embeds: [
                  {
                    title: `${newPost.title}`,
                    url: `https://reddit.com${newPost.permalink}`,
                    fields: [
                      {
                        name: "Subreddit",
                        value: `r/${subreddit.name}`,
                        inline: true,
                      },
                      {
                        name: "Moderator",
                        value: `${currentUser?.username}`,
                        inline: true,
                      },
                      {
                        name: "Post body",
                        value: `${newPost.body}`,
                        inline: true,
                      },
                    ],
                  },
                ],
              };
            }
          }
          try {
            // Send alert to Discord
            await fetch(webhook, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });
            console.log("Alert sent to Discord!");
          } catch (err) {
            console.error(`Error sending alert: ${err}`);
          }
        } catch (err) {
          console.error(`Error sending alert: ${err}`);
        }
      }
    }
  },
);

const useTemplateFour = Devvit.createForm(
  (data) => ({
    fields: [
      {
        name: `templateNumberFourTitle`,
        label: "Post title",
        type: "string",
        defaultValue: data.tempTitle4,
      },
      {
        name: `templateNumberFourBody`,
        label: "Post body",
        type: "paragraph",
        defaultValue: data.tempBody4,
      },
      {
        name: `mybDist`,
        label: `Distinguish?`,
        type: "boolean",
        defaultValue: true,
        helpText:
          "All content created by the app is distinguished, so users clearly see they come from the mod team.",
        disabled: true,
      },
      {
        name: `iSticky`,
        label: `Sticky?`,
        type: "boolean",
      },
      {
        name: `iLock`,
        label: `Lock?`,
        type: "boolean",
      },
    ],
    title: data.tempName4,
    acceptLabel: "Submit",
    cancelLabel: "Cancel",
  }),
  async (_event, context) => {
    const { reddit, ui } = context;
    console.log(_event.values);
    const subreddit = await context.reddit.getCurrentSubreddit();
    const appAccount = (await context.reddit.getAppUser()).username;

    const postTitle = _event.values.templateNumberFourTitle;
    var postBody = _event.values.templateNumberFourBody;
    const currentUser = await reddit.getCurrentUser();

    const distinguishPost = _event.values.mybDist;
    const stickyPost = _event.values.iSticky;
    const lockPost = _event.values.iLock;

    const setRelayAppPostFlair = (await context?.settings.get(
      "setFlairAfterPosting",
    )) as boolean;
    const relayAppFlairText = (await context?.settings.get(
      "relayAppPostFlairText",
    )) as string;

    if (!postTitle) {
      console.log(`Post doesn't have title, returning...`);
      return ui.showToast("Sorry, no title.");
    } else {
      const newPost = await context.reddit.submitPost({
        subredditName: subreddit.name,
        title: postTitle,
        text: postBody,
      });

      if (distinguishPost == true) {
        newPost.distinguish();
        console.log(`Post ${newPost.id} distinguished!`);
      }
      if (stickyPost == true) {
        newPost.sticky();
        console.log(`Post ${newPost.id} stickied!`);
      }
      if (lockPost == true) {
        newPost.lock();
        console.log(`Post ${newPost.id} locked!`);
      }

      if (!setRelayAppPostFlair) {
        console.log("Auto changing the post flair is disabled, skipping...");
      } else {
        console.log("Auto changing the post flair is enabled, okay...");
        await context.reddit.setPostFlair({
          subredditName: subreddit.name,
          postId: newPost.id,
          text: relayAppFlairText,
        });
      }
      await context.reddit.addModNote({
        subreddit: subreddit.name,
        user: appAccount,
        label: "SOLID_CONTRIBUTOR",
        redditId: newPost.id,
        note: `${currentUser?.username} created a mod post (title: ${postTitle}).`,
      });
      console.log(
        `Added mod note for post ${newPost.id} by ${currentUser?.username}.`,
      );
      const sendtoModmail = (await context?.settings.get(
        "sendModmail",
      )) as boolean;
      const sendtoDiscord = (await context?.settings.get(
        "sendDiscord",
      )) as boolean;
      var logMsg = `**Title**: ${newPost.title}\n\n`;
      ((logMsg += `**URL**: https://reddit.com${newPost.permalink}\n\n`),
        (logMsg += `**Moderator**: ${currentUser?.username}\n\n`));
      logMsg += `**Post body**: ${newPost.body}\n\n`;

      ui.showToast("Posted!");
      console.log(
        `${currentUser?.username} used Relay App to post ${newPost.url}`,
      );
      if (sendtoModmail == false) {
        console.log("Not sending to Modmail, skipping...");
      } else {
        await context.reddit.sendPrivateMessageAsSubreddit({
          fromSubredditName: subreddit.name,
          to: appAccount,
          subject: `Mod post submitted`,
          text: logMsg,
        });
        console.log(`Sent to Modmail!`);
      }
      const webhook = (await context?.settings.get("webhookEditor")) as string;
      if (!webhook) {
        console.error("No webhook URL provided");
        return;
      } else {
        try {
          let payload;
          if (sendtoDiscord == false) {
            console.log("Not sending to Discord, skipping...");
          } else {
            const discordRole = await context.settings.get("discordRole");
            let discordAlertMessage;
            if (discordRole) {
              discordAlertMessage = `<@&${discordRole}>\n\n`;
            } else {
              discordAlertMessage = ``;
            }

            if (webhook.startsWith("https://discord.com/api/webhooks/")) {
              console.log("Got Discord webhook, let's go!");

              // Check if the webhook is a Discord webhook
              payload = {
                content: discordAlertMessage,
                embeds: [
                  {
                    title: `${newPost.title}`,
                    url: `https://reddit.com${newPost.permalink}`,
                    fields: [
                      {
                        name: "Subreddit",
                        value: `r/${subreddit.name}`,
                        inline: true,
                      },
                      {
                        name: "Moderator",
                        value: `${currentUser?.username}`,
                        inline: true,
                      },
                      {
                        name: "Post body",
                        value: `${newPost.body}`,
                        inline: true,
                      },
                    ],
                  },
                ],
              };
            }
          }
          try {
            // Send alert to Discord
            await fetch(webhook, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });
            console.log("Alert sent to Discord!");
          } catch (err) {
            console.error(`Error sending alert: ${err}`);
          }
        } catch (err) {
          console.error(`Error sending alert: ${err}`);
        }
      }
    }
  },
);

const useTemplateFive = Devvit.createForm(
  (data) => ({
    fields: [
      {
        name: `templateNumberFiveTitle`,
        label: "Post title",
        type: "string",
        defaultValue: data.tempTitle5,
      },
      {
        name: `templateNumberFiveBody`,
        label: "Post body",
        type: "paragraph",
        defaultValue: data.tempBody5,
      },
      {
        name: `mybDist`,
        label: `Distinguish?`,
        type: "boolean",
        defaultValue: true,
        helpText:
          "All content created by the app is distinguished, so users clearly see they come from the mod team.",
        disabled: true,
      },
      {
        name: `iSticky`,
        label: `Sticky?`,
        type: "boolean",
      },
      {
        name: `iLock`,
        label: `Lock?`,
        type: "boolean",
      },
    ],
    title: data.tempName5,
    acceptLabel: "Submit",
    cancelLabel: "Cancel",
  }),
  async (_event, context) => {
    const { reddit, ui } = context;
    console.log(_event.values);
    const subreddit = await context.reddit.getCurrentSubreddit();
    const appAccount = (await context.reddit.getAppUser()).username;

    const postTitle = _event.values.templateNumberFiveTitle;
    var postBody = _event.values.templateNumberFiveBody;
    const currentUser = await reddit.getCurrentUser();

    const distinguishPost = _event.values.mybDist;
    const stickyPost = _event.values.iSticky;
    const lockPost = _event.values.iLock;

    const setRelayAppPostFlair = (await context?.settings.get(
      "setFlairAfterPosting",
    )) as boolean;
    const relayAppFlairText = (await context?.settings.get(
      "relayAppPostFlairText",
    )) as string;

    if (!postTitle) {
      console.log(`Post doesn't have title, returning...`);
      return ui.showToast("Sorry, no title.");
    } else {
      const newPost = await context.reddit.submitPost({
        subredditName: subreddit.name,
        title: postTitle,
        text: postBody,
      });

      if (distinguishPost == true) {
        newPost.distinguish();
        console.log(`Post ${newPost.id} distinguished!`);
      }
      if (stickyPost == true) {
        newPost.sticky();
        console.log(`Post ${newPost.id} stickied!`);
      }
      if (lockPost == true) {
        newPost.lock();
        console.log(`Post ${newPost.id} locked!`);
      }

      if (!setRelayAppPostFlair) {
        console.log("Auto changing the post flair is disabled, skipping...");
      } else {
        console.log("Auto changing the post flair is enabled, okay...");
        await context.reddit.setPostFlair({
          subredditName: subreddit.name,
          postId: newPost.id,
          text: relayAppFlairText,
        });
      }
      await context.reddit.addModNote({
        subreddit: subreddit.name,
        user: appAccount,
        label: "SOLID_CONTRIBUTOR",
        redditId: newPost.id,
        note: `${currentUser?.username} created a mod post (title: ${postTitle}).`,
      });
      console.log(
        `Added mod note for post ${newPost.id} by ${currentUser?.username}.`,
      );
      const sendtoModmail = (await context?.settings.get(
        "sendModmail",
      )) as boolean;
      const sendtoDiscord = (await context?.settings.get(
        "sendDiscord",
      )) as boolean;
      var logMsg = `**Title**: ${newPost.title}\n\n`;
      ((logMsg += `**URL**: https://reddit.com${newPost.permalink}\n\n`),
        (logMsg += `**Moderator**: ${currentUser?.username}\n\n`));
      logMsg += `**Post body**: ${newPost.body}\n\n`;

      ui.showToast("Posted!");
      console.log(
        `${currentUser?.username} used Relay App to post ${newPost.url}`,
      );
      if (sendtoModmail == false) {
        console.log("Not sending to Modmail, skipping...");
      } else {
        await context.reddit.sendPrivateMessageAsSubreddit({
          fromSubredditName: subreddit.name,
          to: appAccount,
          subject: `Mod post submitted`,
          text: logMsg,
        });
        console.log(`Sent to Modmail!`);
      }
      const webhook = (await context?.settings.get("webhookEditor")) as string;
      if (!webhook) {
        console.error("No webhook URL provided");
        return;
      } else {
        try {
          let payload;
          if (sendtoDiscord == false) {
            console.log("Not sending to Discord, skipping...");
          } else {
            const discordRole = await context.settings.get("discordRole");
            let discordAlertMessage;
            if (discordRole) {
              discordAlertMessage = `<@&${discordRole}>\n\n`;
            } else {
              discordAlertMessage = ``;
            }

            if (webhook.startsWith("https://discord.com/api/webhooks/")) {
              console.log("Got Discord webhook, let's go!");

              // Check if the webhook is a Discord webhook
              payload = {
                content: discordAlertMessage,
                embeds: [
                  {
                    title: `${newPost.title}`,
                    url: `https://reddit.com${newPost.permalink}`,
                    fields: [
                      {
                        name: "Subreddit",
                        value: `r/${subreddit.name}`,
                        inline: true,
                      },
                      {
                        name: "Moderator",
                        value: `${currentUser?.username}`,
                        inline: true,
                      },
                      {
                        name: "Post body",
                        value: `${newPost.body}`,
                        inline: true,
                      },
                    ],
                  },
                ],
              };
            }
          }
          try {
            // Send alert to Discord
            await fetch(webhook, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });
            console.log("Alert sent to Discord!");
          } catch (err) {
            console.error(`Error sending alert: ${err}`);
          }
        } catch (err) {
          console.error(`Error sending alert: ${err}`);
        }
      }
    }
  },
);

Devvit.addMenuItem({
  location: "subreddit",
  label: "[Relay App] - Apply Scheduled Posts",
  description: "Apply scheduled posts based on saved templates.",
  forUserType: "moderator",
  onPress: async (event, context) => {
    await applySchedules(context);
    context.ui.showToast('Scheduled posts updated successfully!');
  },
});

Devvit.addMenuItem({
  location: "post",
  label: "[Relay App] - Clone post",
  description:
    "Option to quickly clone this post. You can edit the post later.",
  forUserType: "moderator",
  onPress: async (event, context) => {
    const { ui } = context;

    const subreddit = await context.reddit.getCurrentSubreddit();
    const appUser = await context.reddit.getCurrentUser();
    const oldPostId = context.postId!;
    const oldPost = await context.reddit.getPostById(oldPostId);

    const oldPostTitle = oldPost.title;
    const oldPostBody = oldPost.body;

    const appAccount = await context.reddit.getAppUser();
    const currentUser = await context.reddit.getCurrentUser();

    const setRelayAppPostFlair = (await context?.settings.get(
      "setFlairAfterPosting",
    )) as boolean;
    const relayAppFlairText = (await context?.settings.get(
      "relayAppPostFlairText",
    )) as string;

    const perms = await appUser?.getModPermissionsForSubreddit(subreddit.name);

    if (!oldPostTitle) {
      console.log(`Post doesn't have title, returning...`);
    }

    if (!oldPostBody) {
      console.log(`Post doesn't have title, returning...`);
    }

    if (perms?.includes("posts") || perms?.includes("all")) {
      console.log(
        `${appUser?.username} has needed permissions (${perms}), ok!`,
      );
      const newPost = await context.reddit.submitPost({
        subredditName: subreddit.name,
        title: oldPostTitle,
        text: oldPostBody!,
      });
      newPost.distinguish();

      if (!setRelayAppPostFlair) {
        console.log("Auto changing the post flair is disabled, skipping...");
      } else {
        console.log("Auto changing the post flair is enabled, okay...");
        await context.reddit.setPostFlair({
          subredditName: subreddit.name,
          postId: newPost.id,
          text: relayAppFlairText,
        });
      }
      await context.reddit.addModNote({
        subreddit: subreddit.name,
        user: appAccount.username,
        label: "SOLID_CONTRIBUTOR",
        redditId: newPost.id,
        note: `${currentUser?.username} created a mod post (title: ${newPost.title}).`,
      });
      console.log(
        `Added mod note for post ${newPost.id} by ${currentUser?.username}.`,
      );
      const sendtoModmail = (await context?.settings.get(
        "sendModmail",
      )) as boolean;
      const sendtoDiscord = (await context?.settings.get(
        "sendDiscord",
      )) as boolean;
      var logMsg = `**Title**: ${newPost.title}\n\n`;
      ((logMsg += `**URL**: https://reddit.com${newPost.permalink}\n\n`),
        (logMsg += `**Moderator**: ${currentUser?.username}\n\n`));
      logMsg += `**Post body**: ${newPost.body}\n\n`;

      ui.showToast("Posted!");
      console.log(
        `${currentUser?.username} used Relay App to post ${newPost.url} (Clone option).`,
      );
      if (sendtoModmail == false) {
        console.log("Not sending to Modmail, skipping...");
      } else {
        await context.reddit.sendPrivateMessageAsSubreddit({
          fromSubredditName: subreddit.name,
          to: appAccount.username,
          subject: `Mod post submitted`,
          text: logMsg,
        });
        console.log(`Sent to Modmail!`);
      }
      const webhook = (await context?.settings.get("webhookEditor")) as string;
      if (!webhook) {
        console.error("No webhook URL provided");
        return;
      } else {
        try {
          let payload;
          if (sendtoDiscord == false) {
            console.log("Not sending to Discord, skipping...");
          } else {
            const discordRole = await context.settings.get("discordRole");
            let discordAlertMessage;
            if (discordRole) {
              discordAlertMessage = `<@&${discordRole}>\n\n`;
            } else {
              discordAlertMessage = ``;
            }

            if (webhook.startsWith("https://discord.com/api/webhooks/")) {
              console.log("Got Discord webhook, let's go!");

              // Check if the webhook is a Discord webhook
              payload = {
                content: discordAlertMessage,
                embeds: [
                  {
                    title: `${newPost.title}`,
                    url: `https://reddit.com${newPost.permalink}`,
                    fields: [
                      {
                        name: "Subreddit",
                        value: `r/${subreddit.name}`,
                        inline: true,
                      },
                      {
                        name: "Moderator",
                        value: `${currentUser?.username}`,
                        inline: true,
                      },
                      {
                        name: "Post body",
                        value: `${newPost.body}`,
                        inline: true,
                      },
                    ],
                  },
                ],
              };
            }
          }
          try {
            // Send alert to Discord
            await fetch(webhook, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });
            console.log("Alert sent to Discord!");
          } catch (err) {
            console.error(`Error sending alert: ${err}`);
          }
        } catch (err) {
          console.error(`Error sending alert: ${err}`);
        }
      }
    } else {
      console.log(
        `${appUser?.username} doesn't have Posts permission (${perms}), not ok!`,
      );
      return ui.showToast(`You don't have the necessary permissions.`);
    }
  },
});

async function applySchedules(context: Devvit.Context) {
  const scheduler = context.scheduler;

  // 1. Clear existing jobs
  const currentJobs = await scheduler.listJobs();
  await Promise.all(
    currentJobs
      .filter((job) => job.name === 'scheduled_post_job')
      .map((job) => scheduler.cancelJob(job.id))
  );

  // 2. Recreate schedules from SAVED settings
  for (const i of [1, 2, 3, 4, 5]) {
    const enabled = await context.settings.get(`postTemplate${i}Enabled`) as boolean;
    if (!enabled) continue;

    const day = await context.settings.get(`postTemplate${i}Day`) as string;
    const hour = await context.settings.get(`postTemplate${i}Hour`) as number;
    const minute = await context.settings.get(`postTemplate${i}Minute`) as number;
    const repeat = await context.settings.get(`postTemplate${i}Repeat`) as boolean;

    const cron = repeat
      ? `${minute} ${hour} * * ${day}`   // weekly
      : `${minute} ${hour} * * *`;      // one-time (handled in job)

    await scheduler.runJob({
      name: 'scheduled_post_job',
      cron,
      data: { templateNumber: i },
    });
  }
}


export default Devvit;
