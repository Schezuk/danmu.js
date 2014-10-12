	var yanSun = {};
			(function(){
				yanSun.animate = (function(){
					var timeoutmap = {},
						timer = null,
						interval = 300;

					function noop(){

					}

					function timeoutWraper(interval){
						return function(){
							var funcs = timeoutmap[interval]['funcs'];
							for(var i=0,len=funcs.length; i<len; i++){
								funcs[i]();
							}
							timeoutmap[interval]['timer'] = window.setTimeout(timeoutWraper, interval);
						};
					}

					function setTimeout(func, interval){
						timeoutmap[interval] || (timeoutmap[interval] = {});
						timeoutmap[interval]['funcs'] || (timeoutmap[interval]['funcs'] = []);
						var i = timeoutmap[interval]['funcs'].indexOf(noop);
						if(i === -1){
							timeoutmap[interval]['funcs'].push(func);
						}else{
							timeoutmap[interval]['funcs'][i] = func;
						}
						if(!timer){
							timeoutmap[interval]['timer']= window.setTimeout(timeoutWraper(interval), interval);
						}
						return interval + "_" + i;
					}

					function clearTimeout(timer){
						var interval = timer.split("_")[0],
							index = timer.split("_")[1];
						timeoutmap['interval']['funcs'][index] = noop;
						for(var i=0,len=timeoutmap['interval']['funcs'].length; i<len; i++){
							if(timeoutmap['interval']['funcs'][i] !== noop){
								return;
							}
						}
						window.clearTimeout(timeoutmap['interval']['timer']);
					}

					function move(options){
						function _wraper(){
							register.clearTimeout(options.timeoutHandler.timeout);
							if(end(element)){
								return;
							}
							if(stop(element)){
								options.timeoutHandler.timeout = register.setTimeout(_wraper, 1000/fps);
								return;
							}
							top && (element.style.top = Math.ceil(parseInt(getStyle(element, 'top'))) - top + 'px') ;
							left && (element.style.left = Math.ceil(parseInt(getStyle(element, 'left'))) - left + 'px') ;
							bottom && (element.style.top = Math.ceil(parseInt(getStyle(element, 'top'))) + bottom + 'px') ;
							right && (element.style.left = Math.ceil(parseInt(getStyle(element, 'left'))) + right + 'px') ;
							timeout = register.setTimeout(_wraper, 1000/fps);
						}
						var element = options.element;
						if(!element){
							console.error("move require element option");
							return;
						}
						var end = options.end || function(element){return false;}, //终结条件
							fps = options.fps || 45,
							register = register || window,
							stop = options.stop,
							timeout = null,
							top = options.top,
							left = options.left,
							right = options.right,
							bottom = options.bottom;
						var timeout = register.setTimeout(_wraper, 1000/fps);
						if(!options.timeoutHandler){
							console.error("require timeout handler");
							return;
						}
						options.timeoutHandler.timeout = timeout;
					}

					return {
						'setTimeout' : setTimeout,
						'clearTimeout' : clearTimeout,
						'move':move
					};
				})();

				var _cid = 0;
				function cid(){
					return  _cid++;
				}

				function every(arr, func){
					for(var i=0,len=arr.length; i<len; i++){
						func(arr[i],i,arr);
					}
				}

				function getStyle(dom, name){
					return window.getComputedStyle(dom)[name];
				}

				function ProrityArray(options){
					this.container = [];
					this.loop = options.loop || false;
					if(options.array){
						options.array.sort(function(a,b){
							return b.prority - a.prority;
						});
						this.container = options.array;
					}
					if(this.loop){
						this.loopContainer = [];
					}
				}
				ProrityArray.prototype.add = function(dm){
					this.container.push(dm);
					this.sort();
				};
				ProrityArray.prototype.get = function(){
					var dm = this.container.shift();
					if(this.loop){
						if(!dm){
							if(this.isEnd()){
								this.container = this.loopContainer;
								this.loopContainer = [];
								this.sort();
								dm = this.container.shift();
								if(dm){
									this.loopContainer.push(dm);
								}
							}
						}else{
							this.loopContainer.push(dm);
						}
					}
					return dm;
				};
				ProrityArray.prototype.sort = function(){
					this.container.sort(function(a, b){
						return b.prority - a.prority;
					});
				};
				ProrityArray.prototype.isEnd = function(){
					var isEnd = true;
					if(!this.loopContainer.length){
						return isEnd;
					}
					every(this.loopContainer, function(dm){
						if(!dm.isEnd){
							isEnd = false;
						}
					});
					return isEnd;
				}

				function DanmuPanel(options){
					var trackoptions = options.tracks;
					this.tracks = [];
					this.loop = options.loop || false;
					this.container = options.container || (new ProrityArray({'loop': this.loop}));
					this.element = options.element;
					if(!this.element){
						console.error('require danmu panel element');
					}
					for(var i=0,len=trackoptions.length; i<len; i++){
						var trackoption = trackoptions[i];
						var track = new DanmuTrack(trackoption);
						this.tracks.push(track);
						this.element.appendChild(track.dom);
					}
				}
				//classify
				DanmuPanel.prototype.start = function(){
					var that = this;
					every(this.tracks, function(track){
						track.start();
					});
					window.setTimeout(function(){
						var rand_pos = Math.floor(Math.random()*that.tracks.length);
						var rand_interval = 3000;
						var dm = that.get();
						if(dm){
							that.tracks[rand_pos].add(dm);
						}else{
							window.setTimeout(arguments.callee, 1000);
							return;
						}
						window.setTimeout(arguments.callee, rand_interval);
					}, 500);
				};
				DanmuPanel.prototype.stop = function(){
					every(this.tracks, function(track){
						track.stop();
					});
				};
				DanmuPanel.prototype.continue = function(){
					every(this.tracks, function(track){
						track.continue();
					});
				};
				DanmuPanel.prototype.hide = function(){
					this.element.style.display = "none";
				};
				DanmuPanel.prototype.show = function(){
					this.element.style.display = "block";
				};
				DanmuPanel.prototype.add = function(dm){
					this.container.add(dm);
				};
				DanmuPanel.prototype.get = function(){
					return this.container.get();
				}

				function DanmuTrack(options){
					options = options || {};
					this.container = [];
					this.width = options.width || 800;
					this.height = options.height || 100;
					this.direction = options.direction || 'left';
					this.backgroundColor = options.backgroundColor || "transparent";
					this.dom = options.dom || document.createElement("div");
					this.dom.id = "danmu-track-" + cid();
					this.dom.className = "danmu-track";
					this.flush();
					this.isStop = false;
					this.isStart = false;
				}

				DanmuTrack.prototype = {
					'flush' : function(){
						this.dom.style.width = this.width ;
						this.dom.style.height = this.height ;
						this.dom.style.backgroundColor = this.backgroundColor;
					},
					'add' : function(dm){
						dm.panel = this;
						this.initDanmuPosition(dm);
						this.container.push(dm);
						this.dom.appendChild(dm.dom);
						dm.isEnd = false;
						return this;
					},
					'remove' : function(dm){
						dm.panel = null;
						this.dom.removeChild(dm.dom);
						return this;
					},
					'show' : function(){
						var dm = this.container.shift();
						var that = this;
						if(!dm){
							window.setTimeout(function(){
								that.show();
							}, 500);
							return;
						}
						switch(this.direction){
							case 'left':
								yanSun.animate.move({'element':dm.dom, 'left':dm.speed, 'end': function(){
									var l = -parseInt(getStyle(dm.dom, 'width'));
									if(parseInt(getStyle(dm.dom, 'left')) <= l){
										dm.isEnd = true;
										console.log(dm.content + 'end');
										that.remove(dm);
										return true;
									}
									return false;
								}, 'stop': function(ele){
									return that.isStop;
								},'timeoutHandler':dm});
								break;
							case 'right':
								yanSun.animate.move({'element':dm.dom, 'right':dm.speed, 'end': function(){
									var l = -parseInt(getStyle(dm.dom, 'width'));
									if(parseInt(getStyle(dm.dom, 'left')) >= l){
										dm.isEnd = true;
										return true;
									}
									return false;
								}, 'stop': function(ele){
									return that.isStop;
								},'timeoutHandler':dm});
								break;
							case 'top':
								yanSun.animate.move({'element':dm.dom, 'top':dm.speed, 'end': function(){
									var l = -parseInt(getStyle(dm.dom, 'width'));
									if(parseInt(getStyle(dm.dom, 'top')) <= l){
										dm.isEnd = true;
										return true;
									}
									return false;
								}, 'stop': function(ele){
									return that.isStop;
								},'timeoutHandler':dm});
								break;
							case 'bottom':
								yanSun.animate.move({'element':dm.dom, 'bottom':dm.speed, 'end': function(){
									var l = -parseInt(getStyle(dm.dom, 'width'));
									if(parseInt(getStyle(dm.dom, 'top')) >= l){
										dm.isEnd = true;
										return true;
									}
									return false;
								}, 'stop': function(ele){
									return that.isStop;
								},'timeoutHandler':dm});
								break;
						}
						var t = (parseInt(getStyle(dm.dom, 'fontSize'))*(dm.content.length)/dm.speed)*1000/45;
						window.setTimeout(function(){
							if(that.isStop){
								window.setTimeout(arguments.callee, 1000);
								return;
							}
							that.show();
						}, t);	
					},
					'start' : function(){
						if(this.isStart){
							console.info("has started");
							return;
						}
						this.isStart = true;
						this.show();
					},
					'stop' : function(){
						this.isStop = true;
					},
					'continue' : function(){
						this.isStop = false;
					},
					'next' : function(dm){
						if(!dm){
							return dm;
						}
						return dm.next;
					},
					'initDanmuPosition' : function(dm){
						var l = parseInt(getStyle(this.dom, 'width')); 
						var h = parseInt(getStyle(this.dom, 'height'));
						switch(this.direction){
							case 'left':
								dm.dom.style.left = l + 'px';
								break;
							case 'right':
								dom.dom.style.left = - parseInt(window.getComputedStyle(dm.dom).width) + 'px';
								break;
							case 'top' :
								dom.dom.style.top = h + 'px';
								break;
							case 'bottom':
								dom.dom.style.top = - parseInt(window.getComputedStyle(dm.dom).height) + 'px';
								break;	
						}
					}

				};

				function Danmu(options){
					var that = this;
					options = options || {};
					this.color = options.color || 'black';
					this.size = options.size || '20px';
					this.speed = options.speed || 10;
					this.time =  options.time || (new Date()).getTime();
					this.clickcount = options.clickcount || 0;
					this.id = options.id;
					this.content = options.content || "";
					this.dom = document.createElement("span");
					this.dom.className = "danmu";
					this.dom.appendChild(document.createTextNode(this.content));
					this.dom.style.fontSize = this.size;
					this.dom.style.color = this.color;
					this.dom.onclick = function(event){
						var event = event || window.event;
						if(options.onclick){
							options.onclick.call(that, event);
						}else{
							that.size = parseInt(that.size) + 1 + "px";
							this.clickCount++;
							that.flush();
						}	
					};
					this.dom.onmouseover = function(event){
						var event = event || window.event;
						if(options.onmouseover){
							options.onmouseover.call(that, event);
						}else{
							//that.panel.stop();
						}
					};
					this.dom.onmouseout = function(){
						var event = event || window.event;
						if(options.onmouseout){
							options.onmouseout.call(that, event);
						}else{
							//that.panel.continue();
						}
					};
					this.isEnd = true;
					this.panel = options.panel || null;
					this.flush();
					this.next = null;
					this.prev = null;
					this.timeout = null;
				}
				Danmu.prototype.color = function(){
					if(arguments.length){
						this.color = arguments[0];
						return this;
					}else{
						return this.color;
					}
				};
				Danmu.prototype.size = function(){
					if(arguments.length){
						this.size = transform_size(arguments[0]);
						return this;
					}else{
						return this.size;
					}
				};
				Danmu.prototype.speed = function(){
					if(arguments.length){
						this.speed = transform_speed(arguments[0]);
						return this;
					}else{
						return this.speed;
					}
				};
				Danmu.prototype.content = function(){
					if(arguments.length){
						this.content = arguments[0];
						return this;
					}else{
						return this.content;
					}
				}
				Danmu.prototype.time = function(){
					return Danmu.time;
				}

				Danmu.prototype.destroy = function(){
					if(this.panel){
						this.panel.remove(this);
					}
					this.dom = null;
				};
				Danmu.prototype.flush = function(){
					this.dom.style.fontSize = this.size;
					this.dom.style.color = this.color;
					this.dom.innerHTML = this.content;
				};
				Danmu.prototype.prority = function(){
					return this.clickcount;
				};

				function transform_size(size){
					return size;
				}

				function transform_speed(speed){
					return speed;
				}

				yanSun.DanmuPanel = DanmuPanel;
				yanSun.DanmuTrack = DanmuTrack;
				yanSun.Danmu = Danmu;
			})();
