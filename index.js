#!/usr/bin/env node

import * as fsPromise from "fs/promises";

import puppeteer from "puppeteer-core";
import createDesktopShortcut from "create-desktop-shortcuts";
import notifier from "node-notifier";
import { fileURLToPath } from "url";
import path from "path";
import { SysTray } from "node-systray-v2";
import image from "./image.js";
import arg from "arg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// import config from "./config.json" with { type: "json" };
const DEFAULT_UPDATE_TIME = 4 * 60 * 60 * 1000; // milliseconds
const DEFAULT_BROWSER_PATH =
  "C:/Program Files/Google/Chrome/Application/chrome.exe";

const URL = "https://www.naukri.com/mnjuser/profile";

const isProduction = typeof process.pkg !== "undefined";

const systray = new SysTray({
  menu: {
    // you should using .png icon in macOS/Linux, but .ico format in windows
    icon: image,
    title: "Profile updater",
    tooltip: "Profile updater",
    items: [
      {
        title: "Exit",
        tooltip: "exit kar oe",
        checked: false,
        enabled: true,
      },
    ],
  },
  debug: false,
  copyDir: true, // copy go tray binary to outside directory, useful for packing tool like pkg.
});

systray.onClick((action) => {
  if (action.seq_id === 0) {
    systray.kill();
    process.exit(0);
  }
});

function startOnStartup() {
  let exePath = null;
  if (isProduction) {
    exePath = process.execPath;
  } else {
    exePath = __filename;
  }

  const startupFolder = path.join(
    process.env.APPDATA,
    "Microsoft\\Windows\\Start Menu\\Programs\\Startup"
  );

  const result = createDesktopShortcut({
    onlyCurrentOS: true,
    windows: {
      filePath: exePath,
      outputPath: startupFolder,
      name: "My App Shortcut",
      comment: "Auto-created shortcut!",
      windowMode: "normal",
      icon: exePath, // optional
    },
  });

  console.log(
    result ? "Shortcut created successfully!" : "Failed to create shortcut."
  );
}

function sendNotification(title, message) {
  // Send notification
  notifier.notify({
    title,
    message,
    icon: "./profile-changer.ico",
    sound: true,
    wait: false,
    appID: "Profile Updater",
  });
}

async function openBrowser(config) {
  const browser = await puppeteer.launch({
    executablePath: config.browserUrl,
    headless: isProduction,
  });

  try {
    const page = await browser.newPage();

    await page.goto(URL, {
      waitUntil: "networkidle0",
      timeout: 0,
    });

    await page.type("#usernameField", config.email);
    await page.type("#passwordField", config.password);
    const loginButton = await page.$(
      ".waves-effect.waves-light.btn-large.btn-block.btn-bold.blue-btn.textTransform"
    );

    await Promise.all([page.waitForNavigation(), loginButton.click()]);

    await page.goto(URL, {
      waitUntil: "networkidle0",
      timeout: 0,
    });

    //? updating resume
    const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      page.click("#attachCV"),
      // some button that triggers file selection
    ]);
    await fileChooser.accept([config.resumeUrl]);

    if (config.resumeHeadlines?.length) {
      // //? updating headline
      await page.click("#lazyResumeHead .edit.icon");
      await page.evaluate(() => {
        const inputField = document.querySelector("#resumeHeadlineTxt");
        inputField.value = ""; // Directly set the value to empty
      });
      await page.type(
        "#resumeHeadlineTxt",
        config.resumeHeadlines[Math.round(Math.random() *  (config.resumeHeadlines?.length -1))]
      );
      await page.click(`form[name="resumeHeadlineForm"] .btn-dark-ot`);
    }

    return true;
  } catch (err) {
    console.log(err);

    return false;
  } finally {
    browser.close();
  }
}

async function handleBrowserNotification(config) {
  const browserAction = await openBrowser(config);
  if (browserAction) {
    sendNotification(
      "Profile updated successfully",
      "Enjoy your life in peace"
    );
  } else {
    sendNotification(
      "There was some error while updating profile",
      "Please don't disturb me for your task"
    );
  }
}

function usage() {
  console.log(`tool [CMD]
  --help\tTo check all the commands
  --init\tInitialize the app
  --email String\tadd your email using flag like this '--email example@ex.com'
  --password String\tadd your password using flag like this '--password yourpassword'
  --resumeUrl String\tadd your resume path using flag like this ' --resumeUrl "C:/Program Files/Google/Chrome/Application/chrome.exe" ' please notice the '/' and '"'
  --resumeHeadlines String\tadd your resume path using flag like this ' --resumeHeadlines "Hi am jobless" ' you can use this command multiple times to add multiple headlines code will update one at random
  --startOnStartup\tenable start on startups only works for windows
  `);
}

async function writeConfig(config) {
  await fsPromise.writeFile(
    path.resolve(__dirname, "./config.json"),
    JSON.stringify(config, null, 2)
  );
}

async function main() {

  let config = null;

  try {
    const args = arg({
      "--init": Boolean,
      "--help": Boolean,
      "--email": String,
      "--password": String,
      "--resumeUrl": String,
      "--resumeHeadlines": String,
      "--startOnStartup": String,
    });

    // console.log(args);
    if (args["--help"]) {
      usage();

      return;
    } else if (args["--init"]) {
      await writeConfig({
        browserUrl: DEFAULT_BROWSER_PATH,
        timer: DEFAULT_UPDATE_TIME,
      });

      return;
    }else if(args["--startOnStartup"]){
      startOnStartup();
      return;
    }

    config = await fsPromise.readFile("./config.json", "utf8").catch((err) => {
      console.log(`Ohh! configs not found please run this tool with --init flag
      you can also use --help flag to check all the flags`);
    });

    if (!config) return;

    config = JSON.parse(config);

    if (!config) return;

    if (args["--email"]) {
      // console.log(args["--email"]);

      config.email = args["--email"];

      await writeConfig(config);
      return;
    }

    if (!config.email) {
      console.log(
        `No email found please add your adding flag like '--email example@ex.com'`
      );
      return;
    }

    if (args["--password"]) {
      // console.log(args["--email"]);

      config.password = args["--password"];

      await writeConfig(config);
      return;
    }

    if (!config.password) {
      console.log(
        `No password found please add your adding flag like '--password yourpassword'`
      );
      return;
    }

    if (args["--resumeUrl"]) {
      // console.log(args["--email"]);

      config.resumeUrl = args["--resumeUrl"];

      await writeConfig(config);
      return;
    }

    if (!config.resumeUrl) {
      console.log(
        `No resume path found please add your adding flag like ' --resumeUrl "C:/Program Files/Google/Chrome/Application/chrome.exe" ' please notice the '/' and '"'`
      );
      return;
    }

    if (args["--resumeHeadlines"]) {
      // console.log(args["--email"]);

      if (config.resumeHeadlines) {
        config.resumeHeadlines.push(args["--resumeHeadlines"]);
      }else{
        config.resumeHeadlines = [args["--resumeHeadlines"]];
      }


      await writeConfig(config);
      return;
    }
  } catch (err) {
    if (err.message.includes("Unexpected token")) {
      console.log(
        "Looks like there is some error in parsing configs please try running with --init flag again"
      );
      return;
    }
    console.log(err.message);
    usage();
  }

  // console.log("here");

  handleBrowserNotification(config);
  setInterval(async () => {
    // console.log("Running task at", new Date());
    handleBrowserNotification(config);

  }, config.timer);
}

(() => {
  main();
})();
