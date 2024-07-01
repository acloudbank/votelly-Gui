# Pollaris GUI
This repository contains the graphical user interface (GUI) front-end of Pollaris, Follow My Vote's blockchain-based polling system.

## Requirements

The general requirements for building the project are

- CMake 3.8 or newer

- Qt Kit 6.x or newer


## Build from the Linux command line

To build the project from the command line, first construct a `build` folder within the project's folder

```
mkdir build
cd build
```

Run `cmake` while properly referencing the location of the Qt Kit available on your operating system.

```
cmake -DCMAKE_PREFIX_PATH=/home/ruser/Qt/6.x.x/gcc_64 ..
make
```

A successful build should produce, among other files, an executable named `PollarisGui`

To run the executable

```
./PollarisGui
```


## Build from Qt Creator

Although the project can be built like any CMake project, one specific way is building from within Qt Creator (v4.15 or newer).

1. Load the project within Qt Creator by loading the CMakeLists.txt file

File -> Open File or Project ... -> Navigate to where the repository has been cloned -> Select the CMakeLists.txt file -> Open

2. When loading the project for the first time:

configure the project by selecting any 6.x version of Qt Kit -> Configure Project

3. Build the project

Build -> Build Project "PollarisGUI"

4. Run the project

Build -> Run


## Starting the GUI

The first time that the GUI starts, the user will be welcomed by Así.  Así will assist the user with connecting their GUI to the Pollaris contract deployed on a smart contract platform such as EOSIO or Peerplays.

### Pollaris Contract on EOSIO

Connectivity to the Pollaris smart contract deployed on an EOSIO blockchain is possible by providing Así with the server's address (e.g. https://myblockchainnode.com:8080/api).

### Pollaris Contract on Peerplays

Connectivity to the Pollaris smart contract deployed on a Peerplays blockchain is under development as of January 2022.
