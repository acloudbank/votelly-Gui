#include <Qappa/Plugin.hpp>
#include <Qappa/ComponentManager.hpp>
#include <Qappa/UXManager.hpp>

void QappaPlugin::registerTypes(const char* uri)
{
    qmlRegisterUncreatableType<ComponentManager>(uri, 1, 0, "ComponentManager",
                                                 QStringLiteral("ComponentManager can only be created in C++"));
    qmlRegisterUncreatableType<UXManager>(uri, 1, 0, "UXManager",
                                          QStringLiteral("UXManager can only be created in C++"));
}
