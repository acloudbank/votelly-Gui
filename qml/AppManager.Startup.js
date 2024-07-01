var firstTimeStartup = false

// Map of canned dialog texts. Each is keyed on a string ID and may contain the following properties:
// text: The text to go into the dialog box. This may contain HTML, and literal < or > characters should be escaped.
// next: Function to call when next dialog button is pressed
// prev: Function to call when previous dialog button is pressed
// input: An item to set to visible once the dialog finishes typing. This item must already be prepared
var dialog = {
    "blockchainLoadFailed": {
        "text": qsTr("Oh no... An internal failure has occurred, and I am unable to start. Please contact support.")
    },
    "introduction": {
        "text": qsTr(`Hello! I'm ${strings.AssistantName} (ah-SEE), the Follow My Vote Assistant. I'm here to ` +
                     `show you how to use the app and to help with any questions or problems along the way.`),
        "next": () => displayDialog("getUrl")
    },
    "getUrl": {
        "text": qsTr(`We're almost ready to open the app, but first I need to connect to the blockchain server, ` +
                     `and I don't yet know where it is. Please enter the address of the blockchain server below:`),
        "next": tryServer,
        "prev": () => displayDialog("introduction"),
        "input": null // Set in beginDialog()
    },
    "badUrl": {
        "text": qsTr(`Hmm... That address doesn't seem valid. A valid one would look something like<br/>` +
                     `<u>https://myblockchainnode.com:8080/api/</u>. Please enter the server address below:`),
        "input": null, // Set in tryServer()
        "next": tryServer,
        "prev": () => displayDialog("introduction")
    },
    "tryingUrl": {
        "text": qsTr("One moment while I try that...")
    },
    "failedUrl": {
        "text": null, // Text is set by processBlockchainNodeError()
        "next": tryServer,
        "prev": () => displayDialog("introduction"),
        "input": null // Input is set by processBlockchainNodeError()
    },
    "timeoutUrl": {
        "text": qsTr("Well, this is taking forever... The server hasn't sent a response yet. If it ever does, " +
                                     "I'll let you know, but in the meantime, feel free to try a different address:"),
        "next": tryServer,
        "prev": () => displayDialog("introduction"),
        "input": null // Input is set by blockchainNodeTimeout()
    },
    "goodConnection": {
        "text": qsTr("Alright! I was able to connect to the server and everything seems correct. If you want, you " +
                     "can update the server address in the technical settings later on."),
        "next": () => displayDialog("ready")
    },
    "latencyConnection": {
        "text": qsTr("OK, I was able to connect to the server. It takes a long time to get a response, which might " +
                     "be an issue with the internet connection. It's not a serious problem, but it might slow us " +
                     "down some. Other than that, everything seems OK."),
        "next": () => displayDialog("ready")
    },
    "syncConnection": {
        "text": qsTr("Hmm... The server is responding, but it looks like it might be out of sync with the " +
                     "blockchain. We can continue, but things might not work right. I'll keep an eye on the " +
                     "situation."),
        "next": () => displayDialog("ready")
    },
    "latencyAndSyncConnection": {
        "text": qsTr("Well... The server does respond, but it takes a long time. This isn't a serious problem, it " +
                     "just might slow us down some. More troublingly, the server also seems to be out of sync with " +
                     "the blockchain. We can go on, but things might not work right. I'll keep an eye on the " +
                     "situation."),
        "next": () => displayDialog("ready")
    },
    "ready": {
        "text": qsTr("Everything is prepared. Press anywhere to start Pollaris."),
        "next": openApp
    },
    "normalStart": {
        "text": qsTr("Welcome back! One moment while I get everything loaded...")
    },
    "normalStartTimeout": {
        "text": qsTr("The server is taking an abnormally long time to respond. It might not be working. I'll let " +
                     "you know if it does eventually respond.")
    },
    "normalLatency": {
        "text": qsTr("Before we get started, a quick heads up: the server is taking a long time to respond, so the " +
                     "app might run a bit slowly."),
        "next": () => displayDialog("ready")
    },
    "normalLatencyAndSync": {
        "text": qsTr("Hmm, the server is running, but it seems to be out of sync with the blockchain, and also, " +
                     "it's responding slowly. We can go on, but things might be slow or not work at all. I'll keep " +
                     "an eye on the situation."),
        "next": () => displayDialog("ready")
    },
    "normalStartupFailure": {
        "text": qsTr("Uh-oh... I can't connect to the blockchain server. Is our internet connection working? " +
                     "I'll keep trying, and I'll let you know if it comes back online.")
    }
}
var currentDialog = undefined
var timeoutCanceler = undefined

function displayDialog(dialogId) {
    if (!dialog[dialogId]) {
        console.error(`Unable to display dialog '${dialogId}'; dialog not defined`)
        console.trace()
        return
    }

    if (!!currentDialog && !!currentDialog.input) {
        currentDialog.input.visible = false
        dialogArea.focus = true
    }

    console.info("Setting dialog to", dialogId)
    currentDialog = dialog[dialogId]
    dialogArea.write(currentDialog.text, () => {
                         if (dialogArea.text !== currentDialog.text)
                            // We are probably a callback for a canceled animation
                            return
                         dialogArea.nextVisible = dialogArea.nextEnabled
                         dialogArea.previousVisible = dialogArea.previousEnabled
                         if (!!currentDialog.input) {
                             currentDialog.input.visible = true
                             currentDialog.input.forceActiveFocus()
                         }
                     })
    dialogArea.nextVisible = false
    dialogArea.previousVisible = false
    dialogArea.nextEnabled = !!currentDialog.next
    dialogArea.previousEnabled = !!currentDialog.prev
}

function beginDialog() {
    if (!!currentDialog) {
        console.info("Not displaying startup dialog because some other dialog is already set")
        return
    }

    // If blockchain server URL is not yet known, do first time startup routine
    if (firstTimeStartup || !assistantSettings.blockchainNodeUrl.toString()) {
        console.info("First time startup! Let's introduce ourselves")
        firstTimeStartup = true
        // Display the initial introduction of the assistant
        displayDialog("introduction")

        // Go ahead and create the server input field; we'll need it in the next dialog segment
        let fieldProperties = {
            "parent": dialogArea.inputArea,
            "visible": false,
            "font": dialogArea.font,
            "placeholderText": qsTr("Blockchain Server Address")
        }
        let fieldCreated = (field) => {
            dialog.getUrl.input = field
            field.width = Qt.binding(() => dialogArea.inputArea.width)
            field.anchors.verticalCenter = field.parent.verticalCenter
        }

        componentManager.createFromSource(serverInputFieldSource, "BlockchainServerInputField",
                                          fieldCreated, dialogArea.inputArea, fieldProperties)
    } else {
        console.info("Routine startup, blockchain server is " + assistantSettings.blockchainNodeUrl)
        displayDialog("normalStart")
    }
}

function progressDialog() {
    if (dialogArea.isTyping)
        dialogArea.completeTyping()
    else if (dialogArea.nextEnabled && dialogArea.nextVisible && !!currentDialog) {
        currentDialog.next()
    }
}

function regressDialog() {
    if (dialogArea.previousEnabled && dialogArea.previousVisible && !!currentDialog && !!currentDialog.prev) {
        currentDialog.prev()
    }
}

function openApp() {
    console.log("Opening the app")
}

// Check blockchain status and update dialog appropriately if it's connected. Returns true if blockchain is connected
function blockchainStatusChanged() {
    // On first time startup, only process the connection if we're currently waiting for the connection
    if (firstTimeStartup && currentDialog !== dialog.tryingUrl && currentDialog !== dialog.timeoutUrl)
        return false

    // How many milliseconds counts as a high latency connection?
    let highlatency = 2000

    let status = blockchain.syncStatus
    console.log("Processing blockchain status change to", status)

    // First-time startup dialog
    if (firstTimeStartup && status > BlockchainInterface.Connected) {
        // OK, we got the server. Check the connection and server health
        let outOfSync = (status === BlockchainInterface.SynchronizedStale)
        let latencyIsHigh = (blockchain.serverLatency > highlatency)

        // Display a dialog depending on the connection characteristics
        if (outOfSync && latencyIsHigh)
            displayDialog("latencyAndSyncConnection")
        else if (outOfSync)
            displayDialog("syncConnection")
        else if (latencyIsHigh)
            displayDialog("latencyConnection")
        else
            displayDialog("goodConnection")

        // If there's a timeout handler pending, go ahead and cancel it.
        if (typeof timeoutCanceler === "function") {
            timeoutCanceler()
            timeoutCanceler = undefined
        }

        // Save the server for future runs
        assistantSettings.blockchainNodeUrl = blockchain.nodeUrl

        return true
    } else {
        // Not first time startup. We expect that the connection should work.
        if (status > BlockchainInterface.Connected) {
            // Check connection and server health
            let outOfSync = (status === BlockchainInterface.SynchronizedStale)
            let latencyIsHigh = (blockchain.serverLatency > highlatency)

            // Display dialog depending on connection characteristics
            if (outOfSync && latencyIsHigh)
                displayDialog("normalLatencyAndSync")
            else if (outOfSync)
                displayDialog("syncConnection")
            else if (latencyIsHigh)
                displayDialog("normalLatency")
            else
                displayDialog("ready")

            // If there's a timeout handler pending, go ahead and cancel it.
            if (typeof timeoutCanceler === "function") {
                timeoutCanceler()
                timeoutCanceler = undefined
            }
        }
    }

    return false
}

function tryServer() {
    let urlInput = Qt.resolvedUrl(currentDialog.input.text)
    console.info("User gave node URL:", urlInput)
    if (!urlInput.toString()) {
        if (!dialog.badUrl.input)
            // Just use the same input method for badUrl ass for getUrl
            dialog.badUrl.input = dialog.getUrl.input

        displayDialog("badUrl")
        return
    }

    displayDialog("tryingUrl")
    Utils.connectUntil(blockchain.syncStatusChanged, blockchainStatusChanged)
    blockchain.nodeUrl = urlInput
    if (typeof timeoutCanceler === "function")
        timeoutCanceler()
    timeoutCanceler = Utils.setTimeout(10000, blockchainNodeTimeout)
}

function processBlockchainNodeError(errorCode) {
    let prelude
    if (currentDialog === dialog.tryingUrl)
        prelude = qsTr("That server exists")
    else if (currentDialog === dialog.timeoutUrl)
        prelude = qsTr("The server finally replied")
    else
        // This error is so late it no longer fits into the conversation. Just ignore it.
        return

    console.warn(`Blockchain node URL seems invalid based on error ${errorCode} from BlockchainInterface`)
    blockchain.disconnect()

    if (!blockchain.nodeUrl.toString().startsWith("http")) {
        let nextTry = "http://" + blockchain.nodeUrl.toString()
        console.info(`Automatically trying node ${nextTry} before reporting error`)
        blockchain.nodeUrl = nextTry
        return
    }

    blockchain.nodeUrl = ""

    if (!dialog.failedUrl.input)
        dialog.failedUrl.input = dialog.getUrl.input
    if (!dialog.badUrl.input)
        dialog.badUrl.input = dialog.getUrl.input

    if (errorCode <= 0)
        return displayDialog("badUrl")
    else if (errorCode === 404)
        dialog.failedUrl.text = prelude + qsTr(", but it didn't recognize our request for blockchain " +
                                     "information. Most likely it is not the correct server, or the path is " +
                                     "incorrect. Please check the address:")
    else if (errorCode === 403)
        dialog.failedUrl.text = prelude + qsTr(", but it said we don't have permission to get the " +
                                     "blockchain information. It's probably not the server we're looking for. " +
                                     "Please check the address:")
    else if (errorCode >= 400 && errorCode < 500)
        dialog.failedUrl.text = prelude + qsTr(", but it said our request made no sense. Please check " +
                                     "the address:")
    else if (errorCode >= 500 && errorCode < 600)
        dialog.failedUrl.text = prelude + qsTr(", but it had an internal error processing our request " +
                                     "for blockchain information. It might not be the right server, or it " +
                                     "might be broken right now. Please try again later, or check the address:")
    else
        dialog.failedUrl.text = prelude + qsTr(", but it gave a response I couldn't understand. It's " +
                                     "probably not the server we want. Please check the address:")

    displayDialog("failedUrl")
}

function blockchainNodeNonsense() {
    let prelude
    if (currentDialog === dialog.tryingUrl)
        prelude = qsTr("That server exists")
    else if (currentDialog === dialog.timeoutUrl)
        prelude = qsTr("The server finally replied")
    else
        // This error is so late it no longer fits into the conversation. Just ignore it.
        return

    console.warn(`Blockchain node URL seems invalid based on nonsense response`)
    blockchain.disconnect()
    blockchain.nodeUrl = ""

    if (!dialog.failedUrl.input)
        dialog.failedUrl.input = dialog.getUrl.input
    dialog.failedUrl.text = prelude + qsTr(", but it gave a response I couldn't understand. It's " +
                                 "probably not the server we want. Please check the address:")
    displayDialog("failedUrl")
}

function normalStartupBlockchainError() {
    if (currentDialog === dialog.normalStartupFailure)
        return

    console.warn(`The blockchain server that worked before gave an error now`)
    displayDialog("normalStartupFailure")
    assistantLogo.rotationRpms = 0

    if (typeof timeoutCanceler === "function") {
        timeoutCanceler()
        timeoutCanceler = undefined
    }
}

function blockchainNodeTimeout() {
    if (currentDialog === dialog.tryingUrl) {
        console.warn(`Blockchain node URL seems invalid based on lack of response`)

        if (!dialog.timeoutUrl.input)
            dialog.timeoutUrl.input = dialog.getUrl.input
        displayDialog("timeoutUrl")
    }
}

function loadBlockhainInterface() {
    let loaded = (blockchain) => {
        if (!blockchain) {
            console.error("Failed to create BlockchainInterface! Application will not run successfully")
            displayDialog("blockchainLoadFailed")
            assistantLogo.rotationRpms = 0
            return
        }

        assistant.blockchain = blockchain
        context.blockchain = blockchain

        if (firstTimeStartup) {
            blockchain.nodeError.connect(processBlockchainNodeError)
            blockchain.nodeResponseNonsense.connect(blockchainNodeNonsense)
        } else {
            // Connect blockchain error signal handlers
            blockchain.nodeError.connect(normalStartupBlockchainError)
            blockchain.nodeResponseNonsense.connect(normalStartupBlockchainError)
            Utils.connectUntil(blockchain.syncStatusChanged, blockchainStatusChanged)

            // Set a timeout timer so we can display a message if the server is connecting too slowly
            if (typeof timeoutCanceler === "function")
            timeoutCanceler()
            timeoutCanceler = Utils.setTimeout(10000, () => {
                                                   displayDialog("normalStartTimeout")
                                                   // Try disconnecting and reconnecting...
                                                   blockchain.disconnect()
                                                   blockchain.nodeUrl = ""
                                                   blockchain.nodeUrl = assistantSettings.blockchainNodeUrl
                                               })
        }
    }

    // Do we have a node URL stored? If so, load BlockchainInterface with it
    let blockchainProperties = {}
    if (!!assistantSettings.blockchainNodeUrl.toString())
            blockchainProperties.nodeUrl = assistantSettings.blockchainNodeUrl
    else
        // No URL known. Cue first time startup experience to get it from the user
        firstTimeStartup = true

    componentManager.createFromSource("import Pollaris.Utilities 1.0\n\nBlockchainInterface{}", "BlockchainInterface",
                                      loaded, assistant, blockchainProperties)
}

function startup(Screen) {
    let createdObjects = {"logo": null, "startupWindow": null}
    let objectCreated = () => {
        const {logo, startupWindow} = createdObjects
        if (!!logo && !!startupWindow) {
            // Logo and window both created; now begin the logo movement startup animation
            logo.reseat(startupWindow.assistantSeat, () => {
                            // If the rotation has been stopped, it means there's a fatal error. Don't start it again
                            if (logo.rotationRpms > 0)
                                logo.adjustRpms(5, () => startupWindow.fadeDialogIn(beginDialog))
                            else
                                startupWindow.fadeDialogIn()
                        })
            // While that animation is playing, instantiate the blockchain interface asynchronously
            loadBlockhainInterface()
        }
    }
    let logoCreated = (logo) => {
        console.info(`Assistant Logo Created`)
        createdObjects.logo = logo
        assistantLogo = logo
        logo.opacity = 1
        objectCreated()
    }
    let windowCreated = (window) => {
        // When the window is first created, its width is negative, so this is my hack to wait for it to settle
        Utils.connectOnce(window.ready, () => {
                              console.info(`Startup Window Created`)
                              createdObjects.startupWindow = window
                              dialogArea = window.dialogArea
                              dialogArea.returnPressed.connect(progressDialog)
                              dialogArea.spacePressed.connect(progressDialog)
                              dialogArea.escapePressed.connect(Qt.quit)
                              dialogArea.previousVisible = false
                              dialogArea.nextVisible = false
                              dialogArea.nextClicked.connect(progressDialog)
                              dialogArea.previousClicked.connect(regressDialog)
                              objectCreated()
                          })
    }

    const mouse = assistant.mousePosition()
    const maxSize = Math.min(Screen.width, Screen.height)/2
    let logoProperties = {
        "visor": visor,
        "assistant": assistant,
        "rotationRpms": 120,
        "opacity": 0,
        "x": mouse.x - 25, "y": mouse.y - 25,
        "width": 50, height: 50,
        "maxSize": maxSize,
        "parent": visor.contentItem
    }
    let windowProperties = {
        "assistant": assistant,
        "width": maxSize,
        "x": Screen.width/2 - maxSize/2,
        "y": Screen.height/2 - maxSize/2,
        "visible": true
    }

    componentManager.createFromFile(Qt.resolvedUrl("AssistantLogo.qml"), logoCreated, visor, logoProperties)
    componentManager.createFromFile(Qt.resolvedUrl("AssistantWindow.qml"), windowCreated, visor, windowProperties)
}

var serverInputFieldSource =
        "import QtQuick.Controls 2.15\n\n" +
        "TextField {\n" +
        "    inputMethodHints: Qt.ImhPreferLowercase | Qt.ImhUrlCharactersOnly" +
        "}"
