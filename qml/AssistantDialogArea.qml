import QtQuick 2.14
import QtQuick.Window 2.14

import "JsUtils.js" as Utils

Item {
    property alias animateTyping: typingAnimation.enabled
    property alias text: typingAnimation.text
    property alias font: dialogText.font
    property Item inputArea: inputAreaItem
    property alias previousVisible: previousButton.visible
    property alias nextVisible: nextButton.visible
    property alias previousEnabled: previousMouseArea.enabled
    property alias nextEnabled: nextMouseArea.enabled

    property bool isTyping: opacityAnimation.running || typingAnimation.running

    signal previousClicked()
    signal nextClicked()
    signal returnPressed()
    signal spacePressed()
    signal escapePressed()

    Keys.onReturnPressed: returnPressed()
    Keys.onSpacePressed: spacePressed()
    Keys.onEscapePressed: escapePressed()

    function write(newText, then) {
        if (isTyping) {
            completeTyping()
            Utils.nextFrame(() => write(newText, then))
            return
        }

        if (typeof then === "function")
            Utils.connectOnce(typingAnimation.stopped, then)

        if (text !== newText)
            text = newText
        else
            // If the text isn't actually changing since last time, just pump the signal to restart the animations
            typingAnimation.textChanged()
    }
    function completeTyping() {
        if (opacityAnimation.running) {
            opacityAnimation.complete()
            typingAnimation.text = ""
        } else {
            typingAnimation.complete()
        }
    }

    Rectangle {
        id: assistantDialogRectangle
        radius: 5
        opacity: .7
        anchors.fill: parent
    }
    Item {
        id: assistantDialogArea
        anchors.fill: assistantDialogRectangle
        anchors.margins: 10

        Text {
            id: dialogText
            anchors.fill: parent
            anchors.bottomMargin: dialogFooterArea.height > 0? dialogFooterArea.height + 10 : 0
            wrapMode: Text.WrapAtWordBoundaryOrAnywhere
            font.pointSize: 18
        }
        Item {
            id: dialogFooterArea
            anchors {
                left: assistantDialogArea.left
                right: assistantDialogArea.right
                bottom: assistantDialogArea.bottom
            }
            height: 80

            Image {
                id: previousButton
                source: "image://assistant/vee"
                rotation: 90
                anchors {
                    left: dialogFooterArea.left
                    top: dialogFooterArea.top
                    bottom: dialogFooterArea.bottom
                    margins: 5
                }
                width: height

                MouseArea {
                    id: previousMouseArea
                    anchors.fill: parent
                    onClicked: previousClicked()
                }
            }
            Item {
                id: inputAreaItem
                anchors {
                    horizontalCenter: dialogFooterArea.horizontalCenter
                    top: dialogFooterArea.top
                    bottom: dialogFooterArea.bottom
                    margins: 5
                }
                width: dialogFooterArea.width - dialogFooterArea.height*2.5
            }
            Image {
                id: nextButton
                source: "image://assistant/vee"
                rotation: -90
                anchors {
                    top: dialogFooterArea.top
                    bottom: dialogFooterArea.bottom
                    right: dialogFooterArea.right
                    margins: 5
                }
                width: height

                MouseArea {
                    id: nextMouseArea
                    anchors.fill: parent
                    onClicked: nextClicked()
                }
            }
        }
    }

    TypingAnimation {
        id: typingAnimation
        target: dialogText

        Behavior on text {
            id: textTypeBehavior
            SequentialAnimation {
                id: opacityAnimation
                PropertyAnimation {
                    target: dialogText
                    property: "opacity"
                    to: 0
                }
                ScriptAction {
                    script: {
                        dialogText.text = ""
                        dialogText.opacity = 1
                    }
                }
                PropertyAction { target: typingAnimation; property: "text" }
            }
        }
    }
}
