Cell Swiper
===========

## To install:
 1. Install NodeJS
 2. Clone Git Repo
 3. Copy `example_serverinfo.json` and name it `serverinfo.json`
 4. Edit the values in `serverinfo.json` to reflect actual information
 5. In terminal, your working directory is the main directory of the repo
 6. Run `nodejs app.js`
 7. Open a browser to `localhost:3000` or whatever port number you chose!

### Notes for installing phash (on Ubuntu):
The phash library may need to be compiled from source. On Ubuntu, the following commands will (typically) take care of that.
 1. `curl -O http://www.phash.org/releases/pHash-0.9.6.tar.gz`
 2. `tar -xvzf pHash-0.9.6.tar.gz`
 3. `cd pHash-0.9.6/`
 4. `sudo apt install -y libsndfile1-dev libvips-dev libsamplerate0-dev libmpg123-dev cimg-dev ffmpeg`
 5. `./configure --enable-openmp=yes --enable-video-hash=no --enable-audio-hash=no LDFLAGS='-lpthread'` (as only image hashing is needed here)`
 5. `sudo ./configure`
 6. `sudo make && make install`
 7. `npm install phash-image`

