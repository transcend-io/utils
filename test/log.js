'use strict';

const chalk = require('chalk');
const overrideStdoutWrite = require('process-utils/override-stdout-write');
const expect = require('chai').expect;
const log = require('../log');

describe('log', () => {
  const testLegacyLog = (getLegacyLog) => {
    it('should supports message without custom options', () => {
      let stdoutData = '';
      overrideStdoutWrite(
        (data) => (stdoutData += data),
        () => getLegacyLog()('basic message')
      );
      expect(stdoutData).to.have.string('basic message');
      expect(stdoutData.startsWith('Serverless: ')).to.be.true;
    });

    it('should support message with custom entity', () => {
      let stdoutData = '';
      overrideStdoutWrite(
        (data) => (stdoutData += data),
        () => getLegacyLog()('basic message', { entity: 'NotServerless' })
      );
      expect(stdoutData.startsWith('NotServerless: ')).to.be.true;
      expect(stdoutData).to.have.string(chalk.yellow('basic message'));
    });

    it('should support message with disabled entity', () => {
      let stdoutData = '';
      overrideStdoutWrite(
        (data) => (stdoutData += data),
        () => getLegacyLog()('basic message', { entity: null })
      );
      expect(stdoutData).to.equal(`${chalk.yellow('basic message')}\n`);
    });

    it('should support message with custom color', () => {
      let stdoutData = '';
      overrideStdoutWrite(
        (data) => (stdoutData += data),
        () => getLegacyLog()('basic message', { color: 'green' })
      );
      expect(stdoutData.startsWith('Serverless')).to.be.true;
      expect(stdoutData).to.include(chalk.keyword('green')('basic message'));
    });

    it('should support underlined message', () => {
      let stdoutData = '';
      overrideStdoutWrite(
        (data) => (stdoutData += data),
        () => getLegacyLog()('basic message', { underline: true })
      );
      expect(stdoutData.startsWith('Serverless: ')).to.be.true;
      expect(stdoutData).to.have.string(chalk.yellow.underline('basic message'));
    });

    it('should support bolded message', () => {
      let stdoutData = '';
      overrideStdoutWrite(
        (data) => (stdoutData += data),
        () => getLegacyLog()('basic message', { bold: true })
      );
      expect(stdoutData.startsWith('Serverless: ')).to.be.true;
      expect(stdoutData).to.have.string(chalk.yellow.bold('basic message'));
    });
  };

  describe('Legacy: Main function', () => {
    beforeEach(() => {
      delete require.cache[require.resolve('../log')];
    });
    testLegacyLog(() => require('../log'));
  });

  describe('`legacy` (interchangeable interface)', () => {
    let originalWrite;
    before(() => {
      originalWrite = log.legacy.write;
    });
    beforeEach(() => {
      log.legacy.write = originalWrite;
    });

    describe('`legacy.write`', () => {
      it('should by default write to stdout', () => {
        delete require.cache[require.resolve('../log')];
        let stdoutData = '';
        overrideStdoutWrite(
          (data) => (stdoutData += data),
          () => require('../log').legacy.write('some test')
        );
        expect(stdoutData).to.equal('some test');
      });
    });
    describe('`legacy.consoleLog`', () => {
      it('should write new line', () => {
        delete require.cache[require.resolve('../log')];
        let stdoutData = '';
        overrideStdoutWrite(
          (data) => (stdoutData += data),
          () => require('../log').legacy.consoleLog('some test')
        );
        expect(stdoutData).to.equal('some test\n');
      });
      it('should have overridable writer', () => {
        let stdoutData = '';
        log.legacy.write = (data) => (stdoutData += data);
        log.legacy.consoleLog('some test');
        expect(stdoutData).to.equal('some test\n');
      });
    });
    describe('`legacy.log`', () => {
      it('should write formatted log', () => {
        delete require.cache[require.resolve('../log')];
        let stdoutData = '';
        overrideStdoutWrite(
          (data) => (stdoutData += data),
          () => require('../log').legacy.log('some test')
        );
        expect(stdoutData).to.have.string('some test');
        expect(stdoutData.startsWith('Serverless: ')).to.be.true;
      });
      it('should have overridable writer', () => {
        let stdoutData = '';
        log.legacy.write = (data) => (stdoutData += data);
        log.legacy.log('some test');
        expect(stdoutData).to.have.string('some test');
        expect(stdoutData.startsWith('Serverless: ')).to.be.true;
      });
    });
  });

  describe('`log` (Event messaging interface)', () => {
    it('should export methods that allow to write to different levels', () => {
      expect(typeof log.log.debug).to.equal('function');
      expect(typeof log.log.info).to.equal('function');
      expect(typeof log.log.notice).to.equal('function');
      expect(typeof log.log.warn).to.equal('function');
      expect(typeof log.log.error).to.equal('function');
    });
    it('should export methods that allow to create namespaced logger', () => {
      const nsLog = log.log.get('some-ns');
      expect(typeof nsLog.debug).to.equal('function');
      expect(typeof nsLog.info).to.equal('function');
      expect(typeof nsLog.notice).to.equal('function');
      expect(typeof nsLog.warn).to.equal('function');
      expect(typeof nsLog.error).to.equal('function');
    });
  });

  describe('`logLevelIndex` and side utils', () => {
    it('should export used log level', () => {
      expect(Number.isInteger(log.logLevelIndex)).to.be.true;
    });
    it("should resolve if we're in verbose mode", () => {
      expect(typeof log.isVerboseMode).to.equal('boolean');
    });
  });

  describe('`writeText`', () => {
    it('should export function', () => {
      expect(typeof log.writeText).to.equal('function');
      expect(log.writeText.length).to.equal(1);
    });
  });

  describe('`progress`', () => {
    it('should expose progress interface', () => {
      expect(typeof log.progress.get('some-progress').info).to.equal('function');
    });
    it('should expose `clear` method', () => {
      expect(typeof log.progress.clear).to.equal('function');
    });
  });

  describe('`getPluginWriters`', () => {
    let testWriters;
    before(() => {
      testWriters = log.getPluginWriters('test');
    });

    it('should expose event logging interface', () => {
      const testLog = testWriters.log;
      expect(typeof testLog.debug).to.equal('function');
      expect(typeof testLog.info).to.equal('function');
      expect(typeof testLog.notice).to.equal('function');
      expect(typeof testLog.warn).to.equal('function');
      expect(typeof testLog.error).to.equal('function');
      expect(typeof testLog.get).to.equal('function');
    });

    it('should expose output writing interface', () => {
      expect(typeof testWriters.writeText).to.equal('function');
    });

    it('should expose progress writing interface', () => {
      expect(typeof testWriters.progress.get('some-progress').info).to.equal('function');
    });

    it('should create one set of writers for a plugin', () => {
      expect(testWriters).to.equal(log.getPluginWriters('test'));
    });
  });
});
