/**
    1. render songs 
    2. scroll top 
    3. Play / pause / seek 
    4. CD rotate 
    5. next / prev
    6. random
    7. next / repeat when ended
    8. active song
    9. scroll active song into view
    10. play song when click
 */
const songAPI = 'http://localhost:3000/songs';
const alternativeAPI = './database/db.json'; // API thay thế


const PLAYER_STORAGE_KEY = "It's you";

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const player = $(".player");
const playlist = $(".playlist");
const heading = $("header h2");
const cdThumb = $(".cd-thumb");
const audio = $("#audio");
const cd = $(".cd");
const playBtn = $(".btn-toggle-play");
const progress = $("#progress");
const prevBtn = $(".btn-prev");
const nextBtn = $(".btn-next");
const randomBtn = $(".btn-random");
const repeatBtn = $(".btn-repeat");
const optionBtn = $(".btn-option");
const removeBtn = $(".option__menu");
const addBtn = $(".add_Song");

var songs = {};

async function init() {
    try {
        const res = await fetch(songAPI);
        if (!res.ok) {
            throw new Error('Network response was not ok');
          
        } else {
            const data = await res.json();
            songs = data; // Lưu dữ liệu vào biến songs            
            app.start(); // Gọi hàm app.start() sau khi dữ liệu đã được lấy
        }
    } catch (error) {
        console.error('Error fetching songs:', error);
        fetchAlternativeData();
    }
    
}

async function fetchAlternativeData() {
    console.log('Starting fetchAlternativeData function');
    try {
        const res = await fetch(alternativeAPI);
        if (!res.ok) {
            console.log('Network response was not ok from alternativeAPI');
            throw new Error('Network response was not ok');
        } else {
            const data = await res.json();           
            songs = data.songs; // Lưu dữ liệu vào biến songs
            app.start(); // Gọi hàm app.start() sau khi dữ liệu đã được lấy
        }
    } catch (error) {
        console.error('Error fetching alternative data:', error);
        // Xử lý lỗi nếu không lấy được dữ liệu thay thế
    }
}


const app = {
    currentIndex: 0,
    isRandom: false,
    isPlaying: false,
    isRepeat: false,
    config: {},
    config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},
    setConfig(key, value) {
        this.config[key] = value;
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config));
    },
    loadConfig() {
        this.isRandom = this.config.isRandom;
        this.isRepeat = this.config.isRepeat;
    },
    setupToConfig() {
        if(this.isRandom) {
            randomBtn.classList.add('active');         
        } 
        if(this.isRepeat) {
            repeatBtn.classList.add('active');
        }
    },
    defineProperties() {
        Object.defineProperty(this, "currentSong", {
            get: function () {
              return songs[Object.keys(songs)[this.currentIndex]];;
            }
        });
    },
    // render data ra DOM
    render() {
        var htmls = songs.map((song,index)=>{
            return `
                <div class="song ${
                        index === this.currentIndex ? "active" : ""
                    }" data-index="${index}">
                        <div class="thumb"
                            style="background-image: url('${song.image}')">
                        </div>
                        <div class="body">
                            <h3 class="title">${song.name}</h3>
                            <p class="author">${song.author}</p>
                        </div>
                        <div class="option" data-index="${index}">
                            <i class="fas fa-ellipsis-h"></i>
                            <ul class="option__menu" >
                                <li class = "removeBtn">Remove</li>
                            </ul>
                        </div>
                    </div>
                `;
        });
        
        playlist.innerHTML = htmls.join("");
    },
    handleEvents(){
        _this = this;

        const cdHeight = cd.offsetWidth;
        document.onscroll = function() {
            const scrollHeight = window.scrollY || document.documentElement.scrollTop;
            const cdNewHeight = cdHeight - scrollHeight;
            const cdOpacity =  cdNewHeight / cdHeight;
            
            // Cd thumb
            if (cdHeight < cdNewHeight) {
                cd.style.width = cdHeight;
                cdOpacity = 1;
            } else if(cdHeight >= cdNewHeight) {
                Object.assign(cd.style, {
                    width: cdNewHeight + 'px',
                    opacity: cdOpacity,
                });

            } else if(cdNewHeight < 0) {
                cd.style.width = 0;
            }
         
        };
        // Xử lý CD quay / dừng
        // Handle CD spins / stops
        const cdThumbAnimate = cdThumb.animate([{ transform: "rotate(360deg)" }], {
            duration: 10000, // 10 seconds
            iterations: Infinity
        });

        cdThumbAnimate.pause();
        // Xử lý khi click play
        // Handle when click play
        playBtn.onclick = function () {
            if (_this.isPlaying) {
            audio.pause();
            } else {
            audio.play();
            }
        };
        // Khi song được play
        // When the song is played
        audio.onplay = function () {
            _this.isPlaying = true;
            player.classList.add("playing");
            cdThumbAnimate.play();
        };
    
        // Khi song bị pause
        // When the song is pause
        audio.onpause = function () {
            _this.isPlaying = false;
            player.classList.remove("playing");
            cdThumbAnimate.pause();
        };

        // Khi tiến độ bài hát thay đổi
        // When the song progress changes
        audio.ontimeupdate = function() {
            const percentSongComplete = Math.floor(audio.currentTime / audio.duration * 100);
      
            if(audio.currentTime) {
                progress.value = percentSongComplete;
                progress.style.backgroundImage = `linear-gradient(90deg, #ec1f55 ${percentSongComplete}%, transparent 0%)`
            }
          };
    
        // Xử lý khi tua song
        // Handling when seek
        progress.oninput = function() {
            audio.currentTime = progress.value * audio.duration / 100;
        };

        // Khi next song
        // When next song
        nextBtn.onclick = () => {         
            if(_this.isRandom)  {
                _this.playRandomSong();
            }else{
                _this.nextSong();
            }
            audio.play();
            _this.scrollActiveSongIntoView();
            _this.activeSong();
        };

        // Khi pre song
        // When pre song
        prevBtn.onclick = () => {
            _this.prevSong();
            audio.play();
            _this.scrollActiveSongIntoView();
            _this.activeSong();
        };

        // Xử lý bật / tắt random song
        // Handling on / off random song
        randomBtn.onclick = () => {
            _this.isRandom = !_this.isRandom;
            _this.setConfig("isRandom", _this.isRandom);
            randomBtn.classList.toggle("active");
        }

        // Xử lý bật / tắt repeat song
        // Handling on / off repeat song
        repeatBtn.onclick = () => {
            _this.isRepeat = !_this.isRepeat;
            _this.setConfig("isRepeat", _this.isRepeat);
            repeatBtn.classList.toggle("active");
        }

        // Xử lý next song khi audio ended
        // Handle next song when audio ended
        audio.onended = () => {
            if (_this.isRepeat) {
                audio.play();
            } else {
                nextBtn.click();
            }
        }

        // Lắng nghe hành vi click vào playlist
        // Listen to playlist clicks
        playlist.onclick = function (e) {
        const songNode = e.target.closest(".song:not(.active)");
        const optionNode = e.target.closest(".option");
        const removeNode = e.target.closest(".removeBtn");
            if (songNode || optionNode || removeNode) {
                
                // Xử lý khi click vào song
                // Handle when clicking on the song
                if (songNode && !optionNode) {
                    _this.currentIndex = Number(songNode.dataset.index);
                    _this.loadCurrentSong();
                    _this.render();
                    audio.play();
                }

                // Xử lý khi click vào song option
                // Handle when clicking on the song option
                if (optionNode) {         
                    $('.option.active')?.classList.remove('active');         
                    optionNode.classList.add('active');                                  
                  
                }

                // Xử lý khi click vào remove song
                if(removeNode) {
                    index = Number(optionNode.dataset.index);
                    console.log('Remove song at index:',index);
                    _this.deleteSong(index);
                }

            }
        };

        // loại bỏ options khi click vào ngoài playlist
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.playlist,.option')) {
                $('.option.active')?.classList.remove('active');    
            }
        });

        // khi kích cỡ của trình duyệt thay đổi thay đổi vị trí của button thêm bài hát
        window.addEventListener('resize', function(event) {
            _this.setPositionButtonAddSong();
        });
  
    },
    loadCurrentSong(){
        heading.textContent = this.currentSong.name;
        cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
        audio.src = this.currentSong.path;
    },
    nextSong() {
        this.currentIndex++;
        if (this.currentIndex >= songs.length) {
            this.currentIndex = 0;
        }
        this.loadCurrentSong();
    },
    prevSong(){
        this.currentIndex--;
        if (this.currentIndex < 0) {
            this.currentIndex = songs.length - 1;
        }
        this.loadCurrentSong();
    },
    playRandomSong(){
        this.currentIndex = Math.floor(Math.random() * songs.length);
        this.loadCurrentSong();
    },
    activeSong() {
        $('.song.active').classList.remove('active');
        const playlistNow = $$('.song');
        playlistNow[this.currentIndex].classList.add('active');     
    },
    scrollActiveSongIntoView() {
        setTimeout(function() {
            $('.song.active').scrollIntoView({
                behaviour: 'smooth',
                block: 'end'
            });

        }, 100);
    },
    deleteSong(index){
        console.log('Delete song at index:', index);
        console.log(songs[index]);
        songs.splice(index, 1);
        this.loadCurrentSong();
        this.render();
    },
    setPositionButtonAddSong(){
        var test = playlist;
        let positionX = 0;
        while (test) {
            positionX += test.offsetLeft;       
            test = test.offsetParent;  
        }

        addBtn.style.right = (positionX + 5)+'px' ;
        // return positionX;
       

    },

    init() {
        this.loadConfig();
        this.setupToConfig();
        // Định nghĩa các thuộc tính cho object
        // Defines properties for the object
        this.defineProperties();
        // Set vị trí cho nút thêm bài hát
        // Set position for the add song button
        this.setPositionButtonAddSong();
        // Lắng nghe / xử lý các sự kiện (DOM events)
        // Listening / handling events (DOM events)
        this.handleEvents();

        // Tải thông tin bài hát đầu tiên vào UI khi chạy ứng dụng
        // Load the first song information into the UI when running the app
        this.loadCurrentSong();
        // Render playlist
        this.render();
    },
  
    start() {
        console.log('App starting...');
        this.init();   
    }
}


init();
