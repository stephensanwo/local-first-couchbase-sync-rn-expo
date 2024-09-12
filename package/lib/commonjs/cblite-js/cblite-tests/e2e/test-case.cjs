"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TestCase = void 0;
var _index = require("../../cblite/index.cjs");
var _chai = require("chai");
var namesData = _interopRequireWildcard(require("./names_100.json"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
class TestCase {
  //setup shared properties
  database = undefined;
  otherDatabase = undefined;
  databaseName = '';
  otherDatabaseName = 'otherDb';
  scopeName = 'testScope';
  collectionName = 'testCollection';
  collection = undefined;
  defaultCollection = undefined;
  scope = undefined;
  directory = undefined;
  dataSource = this.scopeName + '.' + this.collectionName;
  TEST_DOC_TAG_KEY = 'TEST_TAG';
  TEST_DOC_SORT_KEY = 'TEST_SORT_ASC';
  TEST_DOC_REV_SORT_KEY = 'TEST_SORT_DESC';
  async init() {
    try {
      //try to get the platform local directory - can't run tests if we can't save a database to a directory
      //this.databaseName = `db${uuid().toString()}`;
      const engine = this.getEngine();
      this.databaseName = `db${engine.getUUID().replace(/-/g, '')}`;
      const filePathResult = await this.getPlatformPath();
      if (filePathResult.success) {
        this.directory = filePathResult.data;
      } else {
        return {
          testName: 'init',
          success: false,
          message: filePathResult.message,
          data: undefined
        };
      }

      //create a database and then open it
      const databaseResult = await this.getDatabase(this.databaseName, this.directory, '');
      if (databaseResult instanceof _index.Database) {
        this.database = databaseResult;
        await this.database?.open();
        //setup scope and collection
        this.defaultCollection = await this.database?.defaultCollection();
        this.collection = await this.database.createCollection(this.collectionName, this.scopeName);
        if (this.collection === undefined || this.defaultCollection === undefined) {
          return {
            testName: 'init',
            success: false,
            message: 'Failed to create collection',
            data: undefined
          };
        }
      } else {
        if (typeof databaseResult === 'string') {
          const message = databaseResult;
          return {
            testName: 'init',
            success: false,
            message: message,
            data: undefined
          };
        }
      }
      return {
        testName: 'init',
        success: true,
        message: undefined,
        data: undefined
      };
    } catch (error) {
      return {
        testName: 'init',
        success: false,
        message: JSON.stringify(error),
        data: undefined
      };
    }
  }
  async tearDown() {
    if (this.database !== undefined) {
      await this.deleteDatabase(this.database);
      this.database = undefined;
      this.scope = undefined;
      this.collection = undefined;
    }
    if (this.otherDatabase !== undefined) {
      await this.deleteDatabase(this.otherDatabase);
      this.otherDatabase = undefined;
    }
  }
  async deleteDatabase(db) {
    try {
      await db.deleteDatabase();
      return {
        testName: this.constructor.name + '.deleteDatabase',
        success: true,
        message: undefined,
        data: undefined
      };
    } catch (error) {
      if (error.errorMessage !== 'No such open database') {
        return {
          testName: this.constructor.name + '.deleteDatabase',
          success: false,
          message: JSON.stringify(error),
          data: undefined
        };
      } else {
        return {
          testName: this.constructor.name + '.deleteDatabase',
          success: true,
          message: undefined,
          data: undefined
        };
      }
    }
  }
  async getPlatformPath() {
    const pd = new _index.FileSystem();
    try {
      const result = await pd.getDefaultPath();
      return {
        testName: this.constructor.name + '.getPlatformPath',
        success: true,
        message: undefined,
        data: result
      };
    } catch (error) {
      return {
        testName: this.constructor.name + '.getPlatformPath',
        success: false,
        message: JSON.stringify(error),
        data: undefined
      };
    }
  }
  async getDatabase(name, path, encryptionKey) {
    const config = new _index.DatabaseConfiguration();
    try {
      config.directory = path ?? '';
      config.encryptionKey = encryptionKey ?? '';
      return new _index.Database(name, config);
    } catch (error) {
      return JSON.stringify(error);
    }
  }
  createDocument(id) {
    return new _index.MutableDocument(id);
  }
  async createDocumentWithId(withId) {
    return this.createCollectionDocumentWithId(withId, this.defaultCollection);
  }
  async createCollectionDocumentWithId(withId, withCollection) {
    const doc = new _index.MutableDocument(withId);
    doc.setValue('key', 1);
    await withCollection.save(doc);
    const savedDoc = await withCollection.document(withId);
    _chai.assert.equal(savedDoc?.getId(), withId);
    _chai.assert.equal(savedDoc?.getSequence(), 1);
    return _index.MutableDocument.fromDocument(savedDoc);
  }
  createDocumentWithIdAndData(id, data) {
    const doc = new _index.MutableDocument(id);
    doc.setData(data);
    return doc;
  }
  createDocumentNumbered(start, end) {
    const docs = [];
    for (let counter = start; counter <= end; counter++) {
      const doc = new _index.MutableDocument('doc-' + counter);
      doc.setNumber('number', counter);
      docs.push(doc);
    }
    return docs;
  }
  async createDocs(methodName, number) {
    const docs = this.createDocumentNumbered(1, number);
    try {
      for (const doc of docs) {
        await this.database?.save(doc);
      }
    } catch (error) {
      throw new Error(`Can't create docs: ${JSON.stringify(error)}`);
    }
    return docs;
  }
  async createCollectionDocs(methodName, withCollection, number) {
    const docs = this.createDocumentNumbered(1, number);
    try {
      for (const doc of docs) {
        await withCollection.save(doc);
      }
    } catch (error) {
      throw new Error(`Call to ${methodName} failed: Can't create collection docs in collection ${withCollection.name}: ${JSON.stringify(error)}`);
    }
    return docs;
  }
  createTestDoc(id, top, tag) {
    const mDoc = new _index.MutableDocument(`doc-${id}`);
    mDoc.setValue('nullValue', null);
    mDoc.setValue('dataValue', 'value');
    mDoc.setBoolean('booleanTrue', true);
    mDoc.setBoolean('booleanFalse', false);
    mDoc.setLong('longZero', 0);
    mDoc.setLong('longBig', 4000000000);
    mDoc.setLong('longSmall', -4000000000);
    mDoc.setDouble('doubleBig', 1.0e200);
    mDoc.setDouble('doubleSmall', -1.0e200);
    mDoc.setString('stringNull', null);
    mDoc.setString('stringPunk', 'Jett');
    mDoc.setDate('dateNull', null);
    mDoc.setDate('dateCB', new Date('2020-01-01T00:00:00.000Z'));
    mDoc.setBlob('blobNull', null);
    mDoc.setString(this.TEST_DOC_TAG_KEY, tag);
    mDoc.setLong(this.TEST_DOC_SORT_KEY, id);
    mDoc.setLong(this.TEST_DOC_REV_SORT_KEY, top - id);
    return mDoc;
  }
  jsonFromDate(date) {
    const isoDate = date.toISOString();
    return isoDate;
  }
  async loadDocuments(numberOfDocs) {
    await this.loadDocumentsIntoCollection(numberOfDocs, this.defaultCollection);
  }
  async loadDocumentsIntoCollection(numberOfDocs, collection) {
    await this.loadDocumentsStartStopByCollection(1, numberOfDocs, collection);
  }
  async loadDocumentsStartStopByCollection(start, stop, collection) {
    try {
      const last = start + stop - 1;
      for (let counter = start; counter <= stop; counter++) {
        let doc = this.createTestDoc(counter, last, 'no-tag');
        await collection.save(doc);
      }
    } catch (error) {
      throw new Error(`Can't create docs: ${JSON.stringify(error)}`);
    }
  }
  async loadNamesData(collection) {
    const docs = namesData;
    let count = 0;
    // @ts-ignore
    for (const doc of docs.default) {
      const mutableDoc = new _index.MutableDocument(`doc-${count.toString()}`, null, doc);
      await collection.save(mutableDoc);
      count++;
    }
  }
  async verifyDocs(testName, number) {
    return this.verifyCollectionDocs(testName, this.defaultCollection, number);
  }
  async verifyCollectionDocs(testName, withCollection, number) {
    try {
      for (let counter = 1; counter <= number; counter++) {
        const id = 'doc-' + counter;
        const doc = await withCollection.document(id);
        const dictionary = doc.toDictionary();
        const json = JSON.stringify(dictionary);
        const verify = await this.verifyCollectionDoc(testName, id, withCollection, json);
        if (!verify.success) {
          return verify;
        }
      }
    } catch (error) {
      return {
        testName: testName,
        success: false,
        message: 'failed',
        data: JSON.stringify(error)
      };
    }
    return {
      testName: testName,
      success: true,
      message: 'success',
      data: undefined
    };
  }
  async verifyDoc(testName, withId, withData) {
    return this.verifyCollectionDoc(testName, withId, this.defaultCollection, withData);
  }
  async verifyCollectionDoc(testName, withId, withCollection, withData) {
    const doc = await withCollection.document(withId);
    if (doc === undefined && doc === null) {
      return {
        testName: testName,
        success: false,
        message: 'Document not found',
        data: undefined
      };
    } else {
      if (doc?.getId() === withId && JSON.stringify(doc.toDictionary) === withData) {
        return {
          testName: testName,
          success: true,
          message: 'success',
          data: undefined
        };
      } else {
        return {
          testName: testName,
          success: false,
          message: 'failed',
          data: "id or data doesn't match"
        };
      }
    }
  }
  async getCollectionDocumentCount() {
    const queryString = `SELECT COUNT(*) as docCount FROM ${this.dataSource}`;
    const query = this.database?.createQuery(queryString);
    const resultSet = await query.execute();
    if (resultSet != null) {
      return Number.parseInt(resultSet[0].docCount, 10);
    }
    return 0;
  }
  async getDocumentCount() {
    const defaultCollectionName = this.defaultCollection?.name;
    const defaultScopeName = this.defaultCollection?.scope.name;
    const queryString = `SELECT COUNT(*) as docCount FROM ${defaultScopeName}.${defaultCollectionName}`;
    const query = this.database?.createQuery(queryString);
    const resultSet = await query.execute();
    if (resultSet != null) {
      return Number.parseInt(resultSet[0].docCount, 10);
    }
    return 0;
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  getEngine() {
    return _index.EngineLocator.getEngine(_index.EngineLocator.key);
  }
}
exports.TestCase = TestCase;
//# sourceMappingURL=test-case.cjs.map