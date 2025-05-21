// 📦 Import required modules from Minecraft's Script API
// 🎙️ "We start by importing everything we need. These are tools from Minecraft's scripting API that let us show menus, interact with players, and control the game world."

import {
    ActionFormData,        // ✅ Used to create simple menus with clickable buttons (great for main menus)
    FormCancelationReason, // ✅ Helps us understand why a form was closed (like if the player was busy)
    MessageFormData,       // ✅ Used to show a 2-button popup with a message — like a Yes/No choice
    ModalFormData,         // ✅ Allows us to create more advanced forms with text inputs, sliders, dropdowns, and toggles
} from "@minecraft/server-ui"; // 📂 This is where all the UI tools come from

import {
    Player,  // 👤 Represents a player in the game, used for type checking and player-specific actions
    system,  // ⏳ Allows us to delay execution until the next game tick to avoid conflicts
    world    // 🌍 Provides access to the game world and all its players, events, blocks, etc.
} from "@minecraft/server"; // 📂 The core Minecraft scripting module

// 🧭 Detect when a player uses an item (like right-clicking a compass)
// 🎙️ "We listen for when a player uses any item — if it's a compass, we'll open our custom menu."

world.afterEvents.itemUse.subscribe((data) => {
    // 👉 Check if the item used is a compass
    if (data.itemStack.typeId === "minecraft:compass") {
        // 📲 Call our menu function and pass the player who used the item
        ShowMenu(data.source);
    }
});

// 💬 Custom chat command system using "." prefix
// 🎙️ "Now we handle chat messages. If someone types '.menu' or '.warp', we treat it like a command."

world.beforeEvents.chatSend.subscribe((data) => {
    const { message, sender } = data; // 📦 Break apart the message and sender from the data

    if (message.startsWith(".")) {
        data.cancel = true; // ❌ Stop this message from appearing in chat

        // ✂️ Get the text after the dot, like ".menu" -> "menu"
        const args = message.split(".").slice(1)[0];

        // 🔀 Decide what to do based on the command
        switch (args) {
            case "menu":
                sender.sendMessage("Opening menu"); // 💬 Feedback message to player
                system.run(() => ShowMenu(sender)); // ⏱️ Delay opening the menu to next tick
                break;
            case "warp":
                sender.sendMessage("Opening warp menu");
                system.run(() => warpMenu(sender));
                break;
            case "form2":
                sender.sendMessage("Opening form2");
                system.run(() => MessageForm(sender));
                break;
            case "form3":
                sender.sendMessage("Opening form3");
                system.run(() => ModalForm(sender));
                break;
        }
    }
});

/**
 * 📄 ModalForm: This creates a form with different input types (text, dropdown, slider, toggle)
 * 🎙️ "This is the most powerful form — you can collect multiple types of input at once."
 * @param {Player} player
 * @returns {void}
 */
function ModalForm(player) {
    new ModalFormData() // 🛠️ Start building a modal form
        .title("Test GUI") // 🏷️ Form title
        .textField("Enter name", "name", { defaultValue: "sd" }) // ✏️ Text input field
        .dropdown("Select item", ["item1", "item2", "item3"], { defaultValueIndex: 1 }) // 🔽 Dropdown list
        .slider("Select number", 1, 10, { defaultValue: 5 }) // 📏 Slider from 1 to 10
        .toggle("Select toggle", { defaultValue: true }) // ✅ Toggle on/off
        .submitButton("OK") // 🟢 Confirm button
        .show(player).then((data) => {
            if (data.cancelationReason === FormCancelationReason.UserBusy) {
                return ModalForm(player); // 🔁 Retry if the user was busy
            }
            if (data.canceled) return; // ❌ Player closed the form manually

            // 🧩 Get all the form values in one array
            const [textInput, dropdownIndex, amount, confirm] = data.formValues;

            // 📣 Send all inputs back to player as a chat message
            player.sendMessage(
                `textInput: ${textInput}\ndropdownIndex: ${dropdownIndex}\namount: ${amount}\nConfirm: ${confirm}`
            );
        });
}

/**
 * 📨 MessageForm: A simple 2-button confirmation popup
 * 🎙️ "This is perfect for Yes/No or two-choice questions."
 * @param {Player} player
 * @returns {void}
 */
function MessageForm(player) {
    new MessageFormData()
        .title("Test GUI") // 🏷️ Popup title
        .body("Testing message form") // 📝 Message shown to player
        .button1("Warps") // 🟦 First button (index 0)
        .button2("Kill All") // 🟥 Second button (index 1)
        .show(player).then((data) => {
            if (data.cancelationReason === FormCancelationReason.UserBusy) {
                return MessageForm(player); // 🔁 Retry if player was busy
            }
            if (data.canceled) return; // ❌ Exit if canceled

            switch (data.selection) {
                case 0:
                    return warpMenu(player); // 🌍 Open warp menu
                case 1:
                    world.getPlayers().forEach((p) => p.kill()); // 💀 Kill all players
                    break;
            }
        });
}

/**
 * 🧭 ShowMenu: Main action menu with 2 options
 * 🎙️ "This is the main screen players will see — made using ActionFormData, which shows simple buttons."
 * @param {Player} player
 * @returns {void}
 */
function ShowMenu(player) {
    new ActionFormData()
        .title("Test GUI") // 🏷️ Menu title
        .body("Testing action form") // 📝 Description text
        .button("Warps") // 🌐 Button 0
        .button("Kill All") // 💀 Button 1
        .show(player).then((data) => {
            if (data.cancelationReason === FormCancelationReason.UserBusy) {
                return ShowMenu(player); // 🔁 Retry if busy
            }
            if (data.canceled) return; // ❌ Exit if closed

            switch (data.selection) {
                case 0:
                    return warpMenu(player); // 🚪 Open warp submenu
                case 1:
                    world.getPlayers().forEach((p) => p.kill()); // 💀 Kill all players
                    break;
            }
        });
}

/**
 * 🚀 warpMenu: Teleport menu with 3 buttons
 * 🎙️ "This lets players choose where to teleport — a fixed location, random coordinates, or back."
 * @param {Player} player
 * @returns {void}
 */
function warpMenu(player) {
    new ActionFormData()
        .title("Warps") // 🏷️ Title of the warp menu
        .body("Choose a warp destination") // 🗺️ Description
        .button("Spawn")  // 📍 Teleport to fixed location
        .button("Random") // 🎲 Teleport to random coordinates
        .button("Back")   // ↩️ Go back to the main menu
        .show(player).then((data) => {
            if (data.cancelationReason === FormCancelationReason.UserBusy) {
                return warpMenu(player); // 🔁 Retry if busy
            }
            if (data.canceled) return; // ❌ Exit if closed

            switch (data.selection) {
                case 0:
                    // 🚩 Teleport to specific coordinates (like spawn)
                    player.teleport({ x: -21, y: 0, z: 16 }, { x: 0, y: 0, z: 0 });
                    break;
                case 1:
                    // 🎲 Generate random X, Y, Z values from 0 to 99 using Math.random() and Math.floor()
                    player.teleport(
                        {
                            x: Math.floor(Math.random() * 100),
                            y: Math.floor(Math.random() * 100),
                            z: Math.floor(Math.random() * 100)
                        },
                        { x: 0, y: 0, z: 0 }
                    );
                    break;
                default:
                    // ↩️ Return to main menu
                    ShowMenu(player);
                    break;
            }
        });
}
