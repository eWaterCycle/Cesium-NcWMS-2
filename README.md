Brain Visualization 
===================

Installation
------------
Prerequisites 
Node.js: https://nodejs.org/en/
Docker: http://docker.io/

```
git clone https://github.com/VisualStorytelling/brainvis.git
cd brainvis
yarn install
```

Testing
-------

```
npm test
```

Building
--------

```
npm run build
```

Development
-----------

```
docker run -d -p 9000:80 caleydo/taco_server
npm run start
```

Goto http://localhost:8080 , page will reload with every change in src/ dir.


