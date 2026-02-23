# Axon

#### [Releases](https://github.com/sadam-04/Axon-node/releases) &emsp; [Main branch](https://github.com/sadam-04/Axon-node/tree/main) &emsp; [Dev branch](https://github.com/sadam-04/Axon-node/tree/dev)

## Overview

Axon is a lightweight data transfer utility focused on making transfers between desktop and mobile devices as easy as possible.

It uses an internal HTTP/S server to send or receive data over local networks. URLs are encoded in the GUI as QR codes, allowing for easy transfers with mobile phones and tablets, though the same functionality exists for any device with a web-browser.

## Usage

Axon's functionality can be split into two primary categories, the **Outbox** and the **Inbox**. Each has its own interface, and supports both text and file items.

### Outbox

The **Outbox** is used for sending data from the host machine to another device. The left-hand panel displays a list of all items currently in the Outbox. Above the list are a text box and file dialog prompt, which can be used to add new items to the Outbox. Alternatively, a file may be drag-and-dropped anywhere into the Axon window to add it to the Outbox. 

When an Outbox item is selected in the left-hand panel, its details and QR code are shown in the right-hand panel. Another device on Axon's local network can download that file by scanning the QR code shown, or by entering the corresponding URL.

### Inbox

The **Inbox** is used for receiving data from other devices. Similarly to the Outbox, the left-hand panel lists the contents of the Inbox. By default, when no item is selected, a QR code is shown in the right-hand panel that allows local devices to add items to the Inbox.

Selecting an item in the list shows its details in the right-hand panel. Details include the item's name, size, and options for handling the item (Save, Go to folder, Discard).

### Settings and Preferences

Axon's behavior can be changed through two areas: the **Footer** and the **Settings** menu.

#### Footer 

The Footer menu is the small, always-visible ribbon at the bottom of the window. It is used for changing behavior that is more likely to require updates between uses. It includes the following:
- **IP Address** - A dropdown containing the host IP for each detected network interface. The value of this field changes the hostname of URLs encoded in QR codes  
_Note: Axon's internal web server binds to all interfaces (0.0.0.0). Axon will treat all incoming requests the same, regardless of hostname._
- **Protocol** - A toggle for switching between HTTP and HTTPS. Avoid transferring private or sensitive data while using unencrypted HTTP. Running in HTTPS mode requires a valid TLS key and certificate to be provided in the Settings menu.

#### Settings

The Settings menu may be used to change behavior that is unlikely to need frequent updates. It contains the following:
- **TLS key/cert** - Fully-qualified paths of TLS key and certificate files. These are only needed when switching to HTTPS mode.

- **Server port** - Specify the port the internal web server listens on. This value is also encoded in QRs throughout the GUI. The default value should be sufficient in most cases.

## Development

Setting up a development environment is very straightforward. After cloning the repository, run ```npm i``` to install dependencies, then ```npm start``` to launch. [Learn more about NPM](npmjs.com).


## Color palette - Gray
 - #202020
 - #282828
 - #303030
