// jskeystore, version 1.0
// Michael Mayo
//
// DBCache is a simple cache that stores objects in local SQL databases (such as sqlite in Safari).
// To avoid conflicts with your own local databases, it's probably a good idea to keep your DBCache
// in its own database (which is called DBCache by default).
//
// To use this, you need to include the JSON library available at http://www.json.org/json2.js
//
// DBCache is freely distributable under the terms of the MIT license.
//
// Example usage:
// var cache = new JSKeyStore();
// var person = { first_name: 'Mike', last_name: 'Mayo' };
// cache.set('person', person);
//
// cache.get('person', function(obj) {
//   person = obj;
// });
//
// cache.destroy('person');
//

function JSKeyStore() {

    this.database = openDatabase('JSKeyStore', '1.0', 'JSKeyStore', 65536);

    // create a table with a hash of options, where key = column name, and value = column type
    // includes an id column, so passing a primary key is not necessary
    this._createTable = function(name, columns) {
        
        // build the create statement
        var sql = 'create table if not exists ' + name + ' (id integer not null primary key autoincrement';
        for (var c in columns) {
            sql += ', ' + c + ' ' + columns[c];
        }
        sql += ')';

        // execute the sql
        this.database.transaction(
            function(transaction) {
                transaction.executeSql(sql);
            }
        );
    };
    
    this._defErrorHandler = function(transaction, error) {
        //alert("Error: "+error.message+" (Code: "+error.code+")");
        return true;
    }

    this._nullDataHandler = function(transaction, results) {
    }


    this.get = function(key, callback) {
        this._createTable(key, { 'json': 'text' });
        this.database.transaction(
            function(transaction) {
                transaction.executeSql('select * from ' + key + ' limit 1', [], function(txn, r) {
                    var obj = null;
                    if (r && r.rows && r.rows.length > 0) {
                        obj = eval('(' + r.rows.item(0).json + ')');
                    }
                    callback(obj);
                    //obj = results.rows.item(0);
                    //locked = false;                    
                }, this._defErrorHandler);
            }
        );        
    };
    
    this.set = function(key, obj, dataHandler) {
		if (!dataHandler) {
			dataHandler = this._nullDataHandler;
		}
	
        this._createTable(key, { 'json': 'text' });
        this.database.transaction(
            function(transaction) {
                transaction.executeSql('delete from ' + key, [], dataHandler, this._defErrorHandler);
                transaction.executeSql('insert into ' + key + ' (json) VALUES (?)',
                                        [JSON.stringify(obj)], dataHandler, defErrorHandler);
            }
        );        
    };
    
    this.destroy = function(key) {
        this._createTable(key, { 'json': 'text' });
        this.database.transaction(
            function(transaction) {
                transaction.executeSql('delete from ' + key, [], this._nullDataHandler, this._defErrorHandler);
            }
        );        
    };    
}

var cache = new JSKeyStore();