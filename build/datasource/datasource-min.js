YUI.add("datasource-local",function(C){var B=C.Lang,A=function(){A.superclass.constructor.apply(this,arguments);};C.mix(A,{NAME:"DataSource.Local",ATTRS:{source:{value:null}},_tId:0,issueCallback:function(F){if(F.callback){var E=F.callback.scope||this,D=(F.error&&F.callback.failure)||F.callback.success;if(D){D.apply(E,[F]);}}}});C.extend(A,C.Base,{initializer:function(D){this._initEvents();},destructor:function(){},_initEvents:function(){this.publish("request",{defaultFn:function(D){this._defRequestFn(D);}});this.publish("data",{defaultFn:function(D){this._defDataFn(D);}});this.publish("response",{defaultFn:function(D){this._defResponseFn(D);}});},_defRequestFn:function(E){E._yuifacade=false;var D=this.get("source");if(B.isUndefined(D)){E.error=true;}if(E.error){this.fire("error",E);}this.fire("data",C.mix({data:D},E));},_defDataFn:function(E){var D={};D.results=E.data;if(!B.isArray(D.results)){D.results=[D.results];}if(!E.meta){D.meta={};}this.fire("response",C.mix({response:D},E));},_defResponseFn:function(D){A.issueCallback(D);},sendRequest:function(D,F){var E=A._tId++;this.fire("request",{tId:E,request:D,callback:F});return E;}});C.namespace("DataSource");C.DataSource.Local=A;},"@VERSION@",{requires:["base"]});YUI.add("datasource-xhr",function(B){var A=function(){A.superclass.constructor.apply(this,arguments);};B.mix(A,{NAME:"DataSource.XHR",ATTRS:{io:{value:B.io}}});B.extend(A,B.DataSource.Local,{initializer:function(C){this._queue={interval:null,conn:null,requests:[]};},_queue:null,_defRequestFn:function(E){E._yuifacade=false;var D=this.get("source"),C={on:{success:function(H,F,G){this.fire("data",B.mix({data:F},G));},failure:function(H,F,G){G.error=true;this.fire("error",B.mix({data:F},G));this.fire("data",B.mix({data:F},G));}},context:this,arguments:E};this.get("io")(D,C);return E.tId;}});B.DataSource.XHR=A;},"@VERSION@",{requires:["datasource-base"]});YUI.add("datasource-cache",function(B){var A=function(){A.superclass.constructor.apply(this,arguments);};B.mix(A,{NS:"cache",NAME:"DataSourceCache",ATTRS:{}});B.extend(A,B.Cache,{initializer:function(C){this.doBefore("_defRequestFn",this._beforeDefRequestFn);this.doBefore("_defResponseFn",this._beforeDefResponseFn);},_beforeDefRequestFn:function(D){D._yuifacade=false;var C=(this.retrieve(D.request))||null;if(C&&C.response){this._owner.fire("response",B.mix({response:C.response},D));return new B.Do.Halt("DataSourceCache plugin halted _defRequestFn");}},_beforeDefResponseFn:function(C){this.add(C.request,C.response,(C.callback&&C.callback.argument));}});B.namespace("plugin");B.plugin.DataSourceCache=A;},"@VERSION@",{requires:["plugin","datasource-base","cache"]});YUI.add("datasource-jsonparser",function(B){var A=function(){A.superclass.constructor.apply(this,arguments);};B.mix(A,{NS:"parser",NAME:"DataSourceJSONParser",ATTRS:{parser:{readOnly:true,value:B.DataParser.JSON,useRef:true},schema:{}}});B.extend(A,B.Plugin,{initializer:function(C){this.doBefore("_defDataFn",this._beforeDefDataFn);},_beforeDefDataFn:function(D){D._yuifacade=false;var C=(this.get("parser").parse(this.get("schema"),D.data));if(!C){C={meta:{},results:D.data};}this._owner.fire("response",B.mix({response:C},D));return new B.Do.Halt("DataSourceJSONParser plugin halted _defDataFn");}});B.namespace("plugin");B.plugin.DataSourceJSONParser=A;},"@VERSION@",{requires:["plugin","datasource-base","dataparser-json"]});YUI.add("datasource-polling",function(C){var A=C.Lang,B=function(){};B.prototype={_intervals:null,setInterval:function(F,E,H){if(A.isNumber(F)&&(F>=0)){var D=this,G=setInterval(function(){D.sendRequest(E,H);},F);if(!this._intervals){this._intervals=[];}this._intervals.push(G);return G;}else{}},clearInterval:function(F){var E=this._intervals||[],D=E.length-1;for(;D>-1;D--){if(E[D]===F){E.splice(D,1);clearInterval(F);}}}};C.Base.build(C.DataSource.Local.NAME,C.DataSource.Local,[B],{dynamic:false});},"@VERSION@",{requires:["datasource-base"]});YUI.add("datasource",function(A){},"@VERSION@",{use:["datasource-local","datasource-xhr","datasource-cache","datasource-jsonparser","datasource-polling"]});