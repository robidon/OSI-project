var List = function List() {
    List.superclass.constructor.apply(this, []);
    this.items = [];
}
extend(List, Bindable);
List.prototype.add = function (item) {
    this.items.push(item);
    this.trigger('add', item);
    return 1;
}
List.prototype.remove = function (item) {
    var ind = $.inArray(item,this.items);
    if (ind == -1) return 0;
    this.items.splice(ind,1);
    this.trigger('remove', item);
    return 1;
}
List.prototype.addUnique = function(item) {
    var ind = $.inArray(item,this.items);
    if (ind != -1) return 0;
    return this.add(item);
}
List.prototype.insert = function(item, index) {
    this.items.splice(ind,0,item);
    this.trigger('add', item);
    return 1;
}
List.prototype.insertUnique = function (item, index) {
    var ind = $.inArray(item,this.items);
    if (ind != -1) return 0;
    return this.insert(item, index);
}
List.prototype.clear = function () {
    for (var len = this.items.length, i = len-1; i>=0;i--) {
        this.remove(this.items[i]);
    }
    this.trigger('clear');
}

var Collection = function Collection() {
    Collection.superclass.constructor.apply(this, []);
    this.items = [];
    this.itemById = {};
}
extend(Collection, Bindable);
Collection.prototype.length = function () {
    return this.items.length;
}
Collection.prototype.add = function (item) {
    if (typeof(item.id)=='undefined') {
        throw "Unable to insert collection item without id;";
    }
    var ind = $.inArray(item,this.items);
    if (ind != -1) return 0;
    this.itemById[item.id] = item;
    this.items.push(item);
    this.trigger('add', item);
    return 1;
}
Collection.prototype.remove = function (item) {
    var ind = $.inArray(item,this.items);
    if (ind == -1) return 0;
    this.itemById[item.id] = undefined;
    this.items.splice(ind,1);
    this.trigger('remove', item);
    return 1;
}
Collection.prototype.removeById = function (id) {
    if (typeof (this.itemById[id])=='undefined') return 0;
    return this.remove(this.itemById[id]);
}
Collection.prototype.clear = function () {
    for (var len = this.items.length, i = len-1; i>=0;i--) {
        this.remove(this.items[i]);
    }
    this.trigger('clear');
    return 1;
}
Collection.prototype.get = function (id) {
    if (typeof (this.itemById[id]) == 'undefined') return undefined;
    return this.itemById[id];
}
Collection.prototype.getIndex = function (item) {
    for (var len=this.items.length, i = 0;i<len; i++) {
        if (this.items[i] == item) {
            return i;
        }
    }
    return -1;
}
Collection.prototype.duplicate = function () {
    var newColl = new Collection();
    var i;
    for (i=0;i<this.items.length;i++) {
        newColl.add(this.items[i]);
    }
    return newColl;
}