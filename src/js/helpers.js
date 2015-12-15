// Helper functions (github: anvaka/gist:3815296)
function functionReplacer(key, value) {
    if (typeof(value) === 'function') {
        return value.toString();
    }
    return value;
}

function functionReviver(key, value) {
    if (key === "") return value;

    if (typeof value === 'string') {
        var rfunc = /function[^\(]*\(([^\)]*)\)[^\{]*{([^\}]*)\}/,
            match = value.match(rfunc);

        if (match) {
            var args = match[1].split(',').map(function(arg) { return arg.replace(/\s+/, ''); });
            return new Function(args, match[2]);
        }
    }
    return value;
}

/*
var person = {
    name : 'John Smith',
    age : 42,
    isJohn: function() {
        return !!this.name.match(/John/);
    }
};

var jsonString = JSON.stringify(person, functionReplacer);
var restoredPerson = JSON.parse(jsonString, functionReviver);

console.log(restoredPerson.isJohn());
*/
