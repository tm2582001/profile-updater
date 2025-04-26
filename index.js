import puppeteer from "puppeteer-core";
import createDesktopShortcut from "create-desktop-shortcuts";
import notifier from "node-notifier";
import { fileURLToPath } from "url";
import path from "path";
import {SysTray} from 'node-systray-v2';

// import image from "./profile-changer.ico";

// import imageString from "./image.js";

import image from "./image.js";


const systray = new SysTray({
  menu: {
    // you should using .png icon in macOS/Linux, but .ico format in windows
    icon: image,
    title: "Profile updater",
    tooltip: 'Profile updater',
    items: [
      {
        title: 'Exit',
        tooltip: 'exit kar oe',
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
})

const __filename = fileURLToPath(import.meta.url);

import config from "./config.json" with { type: "json" };
const Time = 4 * 60 * 60 * 1000; // milliseconds

const URL = "https://www.naukri.com/mnjuser/profile";

 const isProduction = typeof process.pkg !== 'undefined';



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
      name: 'My App Shortcut',
      comment: 'Auto-created shortcut!',
      windowMode: 'normal',
      icon: exePath, // optional
    }
  });
  
  console.log(result ? 'Shortcut created successfully!' : 'Failed to create shortcut.');
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

async function openBrowser() {
  const browser = await puppeteer.launch({
    executablePath: config.browserUrl,
    headless: false,
  });

  try {
    const page = await browser.newPage();

    await page.goto(URL, {
      waitUntil: "networkidle0",
      timeout: 0,
    });

    await page.type("#usernameField", config.username);
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
    // const [fileChooser] = await Promise.all([
    //   page.waitForFileChooser(),
    //   page.click("#attachCV"),
    //   // some button that triggers file selection
    // ]);
    // await fileChooser.accept([config.resumeUrl]);

    // //? updating headline
    // await page.click("#lazyResumeHead .edit.icon");

    // await page.evaluate(() => {
    //   const inputField = document.querySelector("#resumeHeadlineTxt");
    //   inputField.value = ""; // Directly set the value to empty
    // });

    // await page.type(
    //   "#resumeHeadlineTxt",
    //   config.resumeHeadlines[Math.round(Math.random() * 1)]
    // );

    // await page.click(`form[name="resumeHeadlineForm"] .btn-dark-ot`);

    return true;
  } catch (err) {
    console.log(err);

    return false;
  } finally {
    browser.close();
  }
}

async function main() {

  startOnStartup();

  const browserAction = await openBrowser();
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

  setInterval(async () => {
    // console.log("Running task at", new Date());
    const browserAction = await openBrowser();

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
    // your function or task here
  }, Time);
}

(() => {
  main();
})();
