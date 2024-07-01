qt_add_qml_module(Qappa
  URI /Qappa
  VERSION 1.0
  SOURCES
    Qappa/Qappa.qrc
    Qappa/Plugin.cpp
    Qappa/Plugin.hpp
    Qappa/ComponentManager.cpp
    Qappa/ComponentManager.hpp
    Qappa/UXManager.cpp
    Qappa/UXManager.hpp
 QML_FILES
    Panel.qml
    Blank.qml
    Blanks/qmldir
    Blanks/HorizontalTwoPanel.qml
    Frame.qml
)