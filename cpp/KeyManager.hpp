#pragma once

#include <QObject>

#include <BlockchainInterface.hpp>
#include <MutableTransaction.hpp>
#include <SignableTransaction.hpp>
#include <BroadcastableTransaction.hpp>

class KeyManager : public QObject {
    Q_OBJECT

    Q_PROPERTY(BlockchainInterface* blockchain READ blockchain WRITE setBlockchain NOTIFY blockchainChanged)
    BlockchainInterface* m_blockchain = nullptr;

public:
    explicit KeyManager(QObject *parent = nullptr);

    BlockchainInterface* blockchain() const { return m_blockchain; }

    Q_INVOKABLE SignableTransaction* prepareForSigning(MutableTransaction* transaction);
    Q_INVOKABLE void signTransaction(SignableTransaction* transaction);
    Q_INVOKABLE BroadcastableTransaction* prepareForBroadcast(SignableTransaction* transaction);

public slots:
    void setBlockchain(BlockchainInterface* blockchain) {
        if (m_blockchain != blockchain)
            emit blockchainChanged(m_blockchain = blockchain);
    }

signals:
    void blockchainChanged(BlockchainInterface* blockchain);
};

// Dirty crossover function to decode an Action from JSON with FC
class Action;
void decodeAction(QByteArray json, Action* action);
