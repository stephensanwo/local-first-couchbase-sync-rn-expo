"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DatabaseTests = void 0;
var _testCase = require("./test-case.cjs");
var _chai = require("chai");
var _index = require("../../cblite/index.cjs");
/**
 * DatabaseTests - reminder all test cases must start with 'test' in the name of the method, or they will not run
 * */
class DatabaseTests extends _testCase.TestCase {
  constructor() {
    super();
  }

  /**
   * This method creates a new document with a predefined ID and name, saves it to the database,
   * and then verifies the document by comparing it with the expected data.
   *
   * @returns {Promise<ITestResult>} A promise that resolves to an ITestResult object which contains the result of the verification.
   */
  async testCreateDocument() {
    const id = '123';
    const doc = new _index.MutableDocument();
    doc.setId(id);
    doc.setString('name', 'Scott');
    const dic = doc.toDictionary;
    await this.database?.save(doc);
    return this.verifyDoc('testCreateDocument', id, JSON.stringify(dic));
  }

  /**
   * This method creates a new document with a predefined ID and name, saves it to the database,
   * and then deletes the document and validates the document is no longer in the database
   *
   * @returns {Promise<ITestResult>} A promise that resolves to an ITestResult object which contains the result of the verification.
   */
  async testDeleteDocument() {
    try {
      const id = '123';
      const doc = new _index.MutableDocument(id);
      doc.setString('name', 'Scott');
      await this.database?.save(doc);
      await this.database.deleteDocument(doc);
      return {
        testName: 'testDeleteDocument',
        success: true,
        message: 'success',
        data: undefined
      };
    } catch (error) {
      return {
        testName: 'testDeleteDocument',
        success: false,
        message: JSON.stringify(error),
        data: undefined
      };
    }
  }

  /**
   * This method tests the properties of a database
   *
   * @returns {Promise<ITestResult>} A promise that resolves to an ITestResult object which contains the result of the verification.
   */
  async testDatabaseProperties() {
    const pathResults = await this.getPlatformPath();
    if (!pathResults.success) {
      return pathResults;
    }
    const path = pathResults.data;
    try {
      const dbPath = await this.database?.getPath();
      const dbName = this.databaseName;
      const name = this.database?.getName();
      (0, _chai.expect)(dbPath).to.include(path);
      (0, _chai.expect)(name).to.equal(dbName);
      return {
        testName: 'testDatabaseProperties',
        success: true,
        message: 'success',
        data: undefined
      };
    } catch (error) {
      return {
        testName: 'testDatabaseProperties',
        success: false,
        message: JSON.stringify(error),
        data: undefined
      };
    }
  }

  /**
   * This method tests creating documents with an ID and then
   * make sure the document was saved
   *
   * @returns {Promise<ITestResult>} A promise that resolves to an ITestResult object which contains the result of the verification.
   */
  async testSaveDocWithId() {
    try {
      const docId = 'doc1';
      const doc = await this.createDocumentWithId(docId);
      const count = await this.getDocumentCount();
      _chai.assert.equal(1, count);
      await this.verifyDoc('testSaveDocWithId', docId, JSON.stringify(doc.toDictionary));
      return {
        testName: 'testSaveDocWithId',
        success: true,
        message: 'success',
        data: undefined
      };
    } catch (error) {
      return {
        testName: 'testSaveDocWithId',
        success: false,
        message: JSON.stringify(error),
        data: undefined
      };
    }
  }

  /**
   * This method tests creating documents with weird special characters
   * in the documentId to make sure the Javascript to Native Bridge
   * doesn't eat the characters and the document is saved correctly.
   *
   * @returns {Promise<ITestResult>} A promise that resolves to an ITestResult object which contains the result of the verification.
   */
  async testSaveDocWithSpecialCharactersDocID() {
    try {
      const docId = await this.createDocumentWithId('~@#$%^&*()_+{}|\\][=-/.,<>?":;');
      const count = await this.getDocumentCount();
      _chai.assert.equal(1, count);
      await this.verifyDoc('testSaveDocWithSpecialCharactersDocID', '~@#$%^&*()_+{}|\\][=-/.,<>?":;', JSON.stringify(docId.toDictionary));
      return {
        testName: 'testSaveDocWithSpecialCharactersDocID',
        success: true,
        message: 'success',
        data: undefined
      };
    } catch (error) {
      return {
        testName: 'testSaveDocWithSpecialCharactersDocID',
        success: false,
        message: JSON.stringify(error),
        data: undefined
      };
    }
  }

  /**
   * This method tests updating documents multiple times and then
   * verifying the document sequence number
   *
   * @returns {Promise<ITestResult>} A promise that resolves to an ITestResult object which contains the result of the verification.
   */
  async testSaveSameDocTwice() {
    try {
      //create document first time
      const docId = await this.createDocumentWithId('doc1');
      let count = await this.getDocumentCount();
      _chai.assert.equal(1, count);
      //save the same document again to check sequence number
      await this.database?.save(docId);
      const docSeq2 = await this.database?.getDocument('doc1');
      count = await this.getDocumentCount();
      _chai.assert.equal(1, count);
      _chai.assert.equal(2, docSeq2?.getSequence());
      return {
        testName: 'testSaveSameDocTwice',
        success: true,
        message: 'success',
        data: undefined
      };
    } catch (error) {
      return {
        testName: 'testSaveSameDocTwice',
        success: false,
        message: JSON.stringify(error),
        data: undefined
      };
    }
  }

  /**
   * This method tests creating and then updating the same document
   *
   * @returns {Promise<ITestResult>} A promise that resolves to an ITestResult object which contains the result of the verification.
   */
  async testCreateAndUpdateMutableDoc() {
    try {
      const doc = await this.createDocumentWithId('doc1');
      //update
      doc.setString('firstName', 'Steve');
      await this.database?.save(doc);
      let count = await this.getDocumentCount();
      _chai.assert.equal(1, count);

      //update
      doc.setString('lastName', 'Jobs');
      await this.database?.save(doc);
      count = await this.getDocumentCount();
      _chai.assert.equal(1, count);
      doc.setInt('age', 56);
      await this.database?.save(doc);
      count = await this.getDocumentCount();
      _chai.assert.equal(1, count);

      //validate saves worked
      const updatedDoc = await this.database?.getDocument('doc1');
      _chai.assert.equal(4, updatedDoc?.getSequence());
      _chai.assert.equal('Steve', updatedDoc?.getString('firstName'));
      _chai.assert.equal('Jobs', updatedDoc?.getString('lastName'));
      _chai.assert.equal(56, updatedDoc?.getString('age'));
      return {
        testName: 'testCreateAndUpdateMutableDoc',
        success: true,
        message: 'success',
        data: undefined
      };
    } catch (error) {
      return {
        testName: 'testCreateAndUpdateMutableDoc',
        success: false,
        message: JSON.stringify(error),
        data: undefined
      };
    }
  }

  /**
   * This method tests custom conflict resolution by creating a document,
   * updating it, and then testing if the update worked based on the
   * ConcurrencyControl parameter passed in.
   *
   * @returns {Promise<ITestResult>} A promise that resolves to an ITestResult object which contains the result of the verification.
   */
  async testSaveDocWithConflict() {
    const result1 = await this.saveDocWithConflict('testSaveDocWithConflict', undefined);
    if (!result1.success) return result1;

    //reset the database
    await this.tearDown();
    await this.init();
    const result2 = await this.saveDocWithConflict('testSaveDocWithConflict', _index.ConcurrencyControl.FAIL_ON_CONFLICT);
    if (result2.success) {
      return {
        testName: 'testSaveDocWithConflict',
        success: false,
        message: 'Expected conflict error with ConcurrencyControl.FAIL_ON_CONFLICT but did not get one',
        data: undefined
      };
    }

    //reset the database
    await this.tearDown();
    await this.init();
    const result3 = await this.saveDocWithConflict('testSaveDocWithConflict', _index.ConcurrencyControl.LAST_WRITE_WINS);
    if (!result3.success) return result3;
    return {
      testName: 'testSaveDocWithConflict',
      success: true,
      message: 'success',
      data: undefined
    };
  }
  async testDefaultDatabaseConfiguration() {
    try {
      const config = new _index.DatabaseConfiguration();
      (0, _chai.expect)(config.directory).to.equal(undefined);
      (0, _chai.expect)(config.encryptionKey).to.equal(undefined);
    } catch (error) {
      return {
        testName: 'testDefaultDatabaseConfiguration',
        success: false,
        message: JSON.stringify(error),
        data: undefined
      };
    }
    return {
      testName: 'testDefaultDatabaseConfiguration',
      success: true,
      message: 'success',
      data: undefined
    };
  }
  async testDatabaseEncryptionChangeKey() {
    try {
      const engine = this.getEngine();
      //setup database
      const dbName = `db${engine.getUUID().replace(/-/g, '')}`;
      const config = new _index.DatabaseConfiguration();
      const configNoEncryption = new _index.DatabaseConfiguration();
      const filePathResult = await this.getPlatformPath();
      if (filePathResult.success) {
        config.setDirectory(filePathResult.data);
        configNoEncryption.setDirectory(filePathResult.data);
      }
      //set encryption key
      config.setEncryptionKey('P@33word12');
      const database = new _index.Database(dbName, config);
      await database.open();
      //open collection and use this to create document so we can test changing the key,
      //closing the database and opening to get the document
      const collection = await database.defaultCollection();
      const doc = new _index.MutableDocument('doc-1');
      doc.setString('name', 'test');
      await collection.save(doc);

      //change the key and close and open the database again
      await database.changeEncryptionKey('Password12');
      await database.close();
      config.setEncryptionKey('Password12');
      const database2 = new _index.Database(dbName, config);
      await database2.open();
      const collection2 = await database2.defaultCollection();
      const doc2 = await collection2.document('doc-1');
      (0, _chai.expect)(doc2.getString('name')).to.equal('test');
      await database2.changeEncryptionKey(null);
      await database2.close();

      //set setting the encryption key to null, which should make it blank
      const database3 = new _index.Database(dbName, configNoEncryption);
      await database3.open();
      const collection3 = await database3.defaultCollection();
      const doc3 = await collection3.document('doc-1');
      (0, _chai.expect)(doc3.getString('name')).to.equal('test');
    } catch (error) {
      return {
        testName: 'testDatabaseEncryptionChangeKey',
        success: false,
        message: JSON.stringify(error),
        data: undefined
      };
    }
    return {
      testName: 'testDatabaseEncryptionChangeKey',
      success: true,
      message: 'success',
      data: undefined
    };
  }
  async testCopyingDatabaseConfiguration() {
    try {
      const fs = new _index.FileSystem();
      const defaultDirectory = await fs.getDefaultPath();
      const config = new _index.DatabaseConfiguration();
      config.setDirectory(defaultDirectory);
      config.setEncryptionKey('somePassword');
      const config1 = new _index.DatabaseConfiguration(config);
      //change the original config
      config.setDirectory('newDirectory');
      config.setEncryptionKey(undefined);
      (0, _chai.expect)(config.directory).to.not.equal(config1.directory);
      (0, _chai.expect)(config.encryptionKey).to.not.equal(config1.encryptionKey);
    } catch (error) {
      return {
        testName: 'testCopyingDatabaseConfiguration',
        success: false,
        message: JSON.stringify(error),
        data: undefined
      };
    }
    return {
      testName: 'testCopyingDatabaseConfiguration',
      success: true,
      message: 'success',
      data: undefined
    };
  }
  async testCopyingDatabase() {
    return {
      testName: 'testCopyingDatabase',
      success: false,
      message: 'Not implemented',
      data: undefined
    };
  }

  /**
   * This method tests running compact on a database
   *
   * @returns {Promise<ITestResult>} A promise that resolves to an ITestResult object which contains the result of the verification.
   */
  async testPerformMaintenanceCompact() {
    try {
      //get 20 docs to test with
      const docs = await this.createDocs('testPerformMaintenanceCompact', 20);

      //update the docs 25 times
      for (const doc of docs) {
        for (let counter = 0; counter < 25; counter++) {
          doc.setValue('number', counter.toString());
          await this.database?.save(doc);
        }
      }

      //create blobs for each of the docs
      for (const doc of docs) {
        const dbDoc = await this.database?.getDocument(doc.getId());
        const mutableDoc = _index.MutableDocument.fromDocument(dbDoc);
        const encoder = new TextEncoder();
        const arrayBuffer = encoder.encode('hello blob');
        const blob = new _index.Blob('text/plain', arrayBuffer);
        mutableDoc.setBlob('blob', blob);
        await this.database?.save(mutableDoc);
      }

      //validate document and attachment count
      const originalDocCount = await this.getDocumentCount();
      _chai.assert.equal(originalDocCount, 20);

      //TODO validate amount of attachments

      //compact
      await this.database?.performMaintenance(_index.MaintenanceType.COMPACT);

      //delete all the docs
      for (const doc of docs) {
        await this.database?.deleteDocument(doc);
      }

      //validate the document and attachment count
      const postDeleteDocCount = await this.getDocumentCount();
      _chai.assert.equal(postDeleteDocCount, 0);

      //compact again
      await this.database?.performMaintenance(_index.MaintenanceType.COMPACT);

      //TODO validate the attachment count

      return {
        testName: 'testPerformMaintenanceCompact',
        success: true,
        message: 'success',
        data: undefined
      };
    } catch (error) {
      return {
        testName: 'testPerformMaintenanceCompact',
        success: false,
        message: JSON.stringify(error),
        data: undefined
      };
    }
  }

  /**
   * This method tests adding many documents to a database, then cleaning
   * up and trying again to validate that the init process works and the
   * database isn't the same database file.
   *
   * @returns {Promise<ITestResult>} A promise that resolves to an ITestResult object which contains the result of the verification.
   */
  async testSaveManyDocs() {
    try {
      await this.createDocs('testSaveManyDocs', 2000);
      let count = await this.getDocumentCount();
      _chai.assert.equal(2000, count);
      await this.verifyDocs('testSaveManyDocs', 2000);

      //cleanup
      await this.tearDown();
      await this.init();

      //try again to validate that we can create new documents after cleanup
      await this.createDocs('testSaveManyDocs', 1000);
      count = await this.getDocumentCount();
      _chai.assert.equal(1000, count);
      await this.verifyDocs('testSaveManyDocs', 1000);
      return {
        testName: 'testSaveManyDocs',
        success: true,
        message: 'success',
        data: undefined
      };
    } catch (error) {
      return {
        testName: 'testSaveManyDocs',
        success: false,
        message: JSON.stringify(error),
        data: undefined
      };
    }
  }

  /**
   * This is a helper method used to test ConcurrencyControl
   *
   * @returns {Promise<ITestResult>} A promise that resolves to an ITestResult object which contains the result of the verification.
   */
  async saveDocWithConflict(methodName, control) {
    try {
      const doc = await this.createDocumentWithId('doc1');
      doc.setString('firstName', 'Steve');
      doc.setString('lastName', 'Jobs');
      await this.database.save(doc);

      //get two of the same document
      const doc1a = await this.database.getDocument('doc1');
      const doc1b = await this.database.getDocument('doc1');
      const mutableDoc1a = _index.MutableDocument.fromDocument(doc1a);
      const mutableDoc1b = _index.MutableDocument.fromDocument(doc1b);
      mutableDoc1a.setString('lastName', 'Wozniak');
      await this.database.save(mutableDoc1a);
      mutableDoc1a.setString('nickName', 'The Woz');
      await this.database.save(mutableDoc1a);
      const updatedDoc1a = await this.database.getDocument('doc1');
      _chai.assert.equal('Wozniak', updatedDoc1a?.getString('lastName'));
      _chai.assert.equal('The Woz', updatedDoc1a?.getString('nickName'));
      _chai.assert.equal('Steve', updatedDoc1a?.getString('firstName'));
      _chai.assert.equal(4, updatedDoc1a?.getSequence());
      if (control === undefined) {
        await this.database.save(mutableDoc1b);
      } else {
        await this.database.save(mutableDoc1b, control);
      }
      const updatedDoc1b = await this.database.getDocument('doc1');
      _chai.assert.equal(mutableDoc1b.getString('lastName'), updatedDoc1b.getString('lastName'));
      _chai.assert.equal(5, updatedDoc1b.getSequence());
      return {
        testName: methodName,
        success: true,
        message: 'success',
        data: undefined
      };
    } catch (error) {
      return {
        testName: methodName,
        success: false,
        message: JSON.stringify(error),
        data: undefined
      };
    }
  }
}
exports.DatabaseTests = DatabaseTests;
//# sourceMappingURL=database-test.cjs.map