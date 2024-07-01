#include <Qappa/ComponentManager.hpp>
#include <Qappa/UXManager.hpp>

#include <Assistant.hpp>
#include <Task.hpp>
#include <BlockchainInterface.hpp>
#include <MutableTransaction.hpp>
#include <SignableTransaction.hpp>
#include <BroadcastableTransaction.hpp>
#include <KeyManager.hpp>
#include <Action.hpp>
#include <Enums.hpp>

#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QNetworkAccessManager>
#include <QSettings>
#include <QQmlPropertyMap>
#include <QDebug>

#define POLLARIS_1_0 "Pollaris.Utilities", 1, 0

int main(int argc, char *argv[]) {
    // Install the Assistant as the log message handler
    qInstallMessageHandler(&Assistant::messageHandler);

    QCoreApplication::setAttribute(Qt::AA_EnableHighDpiScaling);
    // On Windows, use an ini file for persistence rather than the registry
    if (QSet<QString>{QStringLiteral("winrt"), QStringLiteral("windows")}.contains(QSysInfo::productType()))
        QSettings::setDefaultFormat(QSettings::IniFormat);

    QGuiApplication app(argc, argv);
    app.setApplicationDisplayName(QObject::tr("Pollaris"));
    app.setApplicationName(QObject::tr("Pollaris"));
    app.setApplicationVersion("Alpha");
    app.setOrganizationName(QObject::tr("Follow My Vote"));
    app.setOrganizationDomain(QStringLiteral("https://followmyvote.com"));

    QQmlApplicationEngine engine;
    // Add the QRC to the import paths so that Qappa can be imported
    engine.addImportPath(":/");

    qmlRegisterUncreatableType<Pollaris>(POLLARIS_1_0, "Pollaris",
                 QStringLiteral("Pollaris is an enumeration container and cannot be instantiated directly in QML"));
    qmlRegisterType<Assistant>(POLLARIS_1_0, "Assistant");
    qmlRegisterUncreatableType<Task>(POLLARIS_1_0, "Task",
                                     QStringLiteral("Tasks can only be created by the Assistant"));
    qmlRegisterType<BlockchainInterface>(POLLARIS_1_0, "BlockchainInterface");
    qmlRegisterType<KeyManager>(POLLARIS_1_0, "KeyManager");
    qmlRegisterUncreatableType<AbstractTableInterface>(POLLARIS_1_0, "TableInterface",
                                      QStringLiteral("This is an abstract interface which cannot be instantiated"));
    qmlRegisterUncreatableType<QAbstractListModel>(POLLARIS_1_0, "TableModel",
                                      QStringLiteral("This is an abstract interface which cannot be instantiated"));
    qmlRegisterUncreatableType<MutableTransaction>(POLLARIS_1_0, "MutableTransaction",
                                  QStringLiteral("MutableTransactions can only be created by BlockchainInterface"));
    qmlRegisterUncreatableType<SignableTransaction>(POLLARIS_1_0, "SignableTransaction",
                                          QStringLiteral("SignableTransactions can only be created by KeyManager"));
    qmlRegisterUncreatableType<BroadcastableTransaction>(POLLARIS_1_0, "PackedTransaction",
                                            QStringLiteral("PackedTransactions can only be created by KeyManager"));
    qmlRegisterType<Action>(POLLARIS_1_0, "Action");

    ComponentManager* componentManager = new ComponentManager(&engine, &app);
    auto componentMgrName = QStringLiteral("componentManager");
    UXManager* uxManager = new UXManager(componentManager, &app);
    auto uxMgrName = QStringLiteral("uxManager");
    QQmlPropertyMap contextMap;

    engine.addImageProvider(QStringLiteral("assistant"), Assistant::getLogoProvider());
    engine.rootContext()->setContextProperty("strings", Strings::MapOfAll);
    engine.rootContext()->setContextProperty(componentMgrName, componentManager);
    engine.rootContext()->setContextProperty(uxMgrName, uxManager);
    engine.rootContext()->setContextProperty("context", &contextMap);

    uxManager->begin();

    return app.exec();
}
